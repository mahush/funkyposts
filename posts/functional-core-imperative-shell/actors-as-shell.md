## Introduction 

This post belongs to the *funkyposts* blog, where I explore functional programming patterns applicable in a c++ environment and grounded in clear code examples.

Modularity is key for managing complexity. By decoupling parts of a system, we improve separation of concerns, simplify reasoning, reduce bugs, and generally increase maintainability.

How does this principle apply in context of the *functional core - imperative shell* architecture? In other words, how do we effectively decouple here? This post will show what that can look like through a concrete example and in turn pointing out the benefits in detail.

## The Design Idea

The *functional core - imperative shell* architecture, requires code to live either in the shell or in the core. The shell handles side effects like IO, state or timers. The core contains the business logic implemented as pure functions.

Splitting the core into modules is straightforward as this is mostly about grouping pure functions. But how do we split the shell into pieces? This is where the actor model fits perfectly, thanks to its natural ability to manage side effects. So, the idea is to implement shells as actors. This allows multiple shells to coexist cleanly while still interacting easily with one another. The application then becomes a collection of shell-core pairs.

Let’s look at how this design unfolds in practice with an example from **funkysnakes**. The actor model used here is a minimal custom one based on the Asio framework with similar semantics to ROS2. As described above, this game’s implementation is distributed across multiple such actors.

Let's focus on two actors that are connected by a topic that communicates the `DirectionMsg`, representing a requested direction for the player's snakes.

```cpp
enum class Direction { UP, DOWN, LEFT, RIGHT };

struct DirectionMsg {
	PlayerId player_id;
	Direction direction;
};
```

This message is published by the `InputActor` that is responsible for handling user input once a player presses a direction key.

```cpp
class InputActor : public Actor<InputActor> {
	public:
		InputActor(ActorContext ctx, 
					  TopicPtr<DirectionMsg> direction_topic)
		: Actor{ctx},
		  direction_pub_{create_pub(std::move(direction_topic))} {}
		  
	private:
		void onKeyEvent(Key key) {
			if (auto direction_msg = keyToDirectionMsg(key)) {
				direction_pub_->publish(*direction_msg);
			}
		}
		
		PublisherPtr<DirectionMsg> direction_pub_;
};
```

The `GameEngineActor` receives the `DirectionMsg` message and applies it to its game state `game_state_`. Once the `game_loop_timer_` triggers, the snakes are moved forward based on the latest direction. The processing of actor inputs like messages or timer events is coordinated in the `processInputs` method, which is invoked whenever an input arrives.

```cpp
class GameEngineActor : public Actor<GameEngineActor> {
	public:
		GameEngineActor(ActorContext ctx, 
							 TopicPtr<DirectionMsg> direction_topic,
						    TimerFactoryPtr timer_factory)
		: Actor(ctx),
		  direction_sub_(create_sub(direction_topic)),
		  game_loop_timer_(create_timer<GameTimer>(timer_factory)) {}
		
		void processInputs() override {
			if (auto direction_msg = direction_sub_.tryTakeMessage()) {
				// applies direction to game_state_ by calling the related pure function of the core here
			}
			
			if (auto elapsed_event = game_loop_timer_.tryTakeElapsedEvent()) {
				// moves snakes forward by calling the related pure function of the core here
			}
		}
	      
	SubscriptionPtr<DirectionMsg> direction_sub_;
	GameLoopTimerPtr game_loop_timer_;
	GameState game_state_;
};
```

In summary, the `InputActor` asynchronously publishes player direction updates, while the `GameEngineActor` consumes them and evolves the game state each time the game loop timer fires.

This modular design comes with some benefits, let's take a closer look:

- Separation of Concerns: Clear Responsibilities and Independent Module Interfaces
	The input handling and game logic are completely decoupled. Each actor has a narrow, focused responsibility. The`DirectionMsg` is the only connecting point between the modules. The`DirectionMsg` forms their connection point which is independent of any concrete actor, so the modules don’t depend on each other directly—they only agree on a shared data contract. This keeps the boundaries clean and prevents any form of tight coupling.

- Simplified Reasoning: Localized Complexity
	Complexity is distributed across multiple shells. Each shell only handles handles its own side effects. The `GameEngineActor` doesn't cares about publishing direction messages, and the `InputActor` doesn't deal with the game state or the game loop timer. Each part remains small and understandable.

- Fewer Bugs: Concurrency and Isolation
	Processing key events and running the game loop happen asynchronously. Key events occur sporadically, while the game loop runs periodically via a timer. Each actor has its own single-threaded execution environment and processes events such as incoming messages or timer  expirations sequentially. This eliminates low-level multithreading issues such as data races, because there is no shared mutable state and therefore no need for manual synchronization. 

- Better Maintainability: Independent Scaling
  You can add another input source, such as a bluetooth controller, without touching the `GameEngineActor`. You can even add it without touching the existing `InputActor`, just adding another actor that publishes `DirectionMsg` message. Each module evolves independently.

Actually there is one more interesting benefit that goes beyond modularity: The actor based *functional core - imperative shell* design is able to bridge functional with non-functional code within the same application. Because actors interact only through messages, one actor implemented shell-core pair can naturally integrate with another actor implemented in a traditional OOP design as. This is especially helpful if you are about to transition from an OOP design to a functional one or if one part of the application relies on external libraries their interface is incompatible with a functional programming approach.
## Summary

It turns out the Actor model suits perfectly for implementing interconnected core-shell pairs and this way the perfect tool to apply separation of concerns to the *functional core - imperative shell* architecture. So, by splitting the application into multiple shell-core pairs we gain perfect decoupling, less complexity per pair, great concurrency support and scaling options. In addition, this architecture allows mixing the functional programming paradigm with other ones within the same application.

This approach shows how C++ can support clean functional design while remaining fully interoperable with other paradigms and existing codebases.
