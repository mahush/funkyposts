## Introduction 

This post belongs to the *funkyposts* blog, where I explore functional programming patterns applicable in a C++ environment and grounded in clear code examples.

Modularity is key for managing complexity. By decoupling parts of a system, we improve separation of concerns, simplify reasoning, reduce bugs, and generally increase maintainability. In short, striving for modularity really pays off. 

How does this principle apply in the context of the *functional core - imperative shell* architecture? In other words, how do we effectively decouple here? This post will show what that can look like through a concrete example and in turn pointing out the benefits in detail.

## The Design Idea

 Here's a quick reminder on the *functional core - imperative shell* architecture: It requires code to live either in the shell or in the core. The shell handles side effects like IO, state or timers in an imperative way. The core contains the business logic implemented as pure functions.

So, splitting the core into modules is straightforward as this is mostly about grouping pure functions. But how do we split the shell into pieces? This is where the actor model fits perfectly, thanks to its natural ability to manage side effects. So, the simple yet powerful idea is to combine the actor model with the *functional core - imperative shell* architecture and implement shells as actors. This allows multiple shells to coexist cleanly while still interacting easily with one another. The application then becomes a collection of shell-core pairs, meaning each shell has its own core. Actually, it makes even more sense to put it the other way around: the business logic that is implemented in pure functions is split into multiple cores and each gets its own shell that handles only the side effects required by its core.

Let’s see this design in action with an example from my **funkysnakes** project. The actor implementation there I prototyped on my own on top of the Asio framework. It's quite lean although it has similar semantics to ROS2 in terms of topic based message passing. However, the *funkysnakes* game implementation is distributed across multiple actors, each following the core–shell pattern as described above.

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

	private:
		SubscriptionPtr<DirectionMsg> direction_sub_;
		GameLoopTimerPtr game_loop_timer_;
		GameState game_state_;
};
```

In summary, the `InputActor` asynchronously publishes player direction updates, while the `GameEngineActor` consumes them and evolves the game state each time the game loop timer fires.

Of course, this modular design comes with some benefits, let's take a closer look:

- Separation of Concerns: Clear Responsibilities and Independent Module Interfaces
	The input handling and game logic are completely decoupled. Each actor has a narrow, focused responsibility. The `DirectionMsg` forms their connection point which is independent of any concrete actor, so the modules don’t depend on each other directly—they only agree on a shared data contract. This keeps the boundaries clean and prevents any form of tight coupling.

- Simplified Reasoning: Localized Complexity
	Complexity is distributed across multiple shells. Each shell only handles its own side effects. The `GameEngineActor` doesn't care about publishing direction messages, and the `InputActor` doesn't deal with the game state or the game loop timer. Each part remains small and understandable.

- Fewer Bugs: Concurrency and Isolation
	Processing key events and running the game loop happen asynchronously. Key events occur sporadically, while the game loop runs periodically via a timer. Each actor has its own single-threaded execution environment and processes events such as incoming messages or timer  expirations sequentially. This eliminates low-level multithreading issues such as data races, because there is no shared mutable state and therefore no need for manual synchronization. Everyone else that has spent days debugging low level multithreading issues knows how valuable such a design is.

- Better Maintainability: Independent Scaling
  You can add another input source, such as a Bluetooth controller, without touching the `GameEngineActor`. You can even add it without touching the existing `InputActor`, just adding another actor that publishes a `DirectionMsg` message. Each module evolves independently.

Actually, there is one more interesting benefit that goes beyond modularity: The actor-based *functional core - imperative shell* design is able to bridge functional with non-functional code within the same application. Because actors interact only through messages, a shell-core pair implemented as an actor can naturally integrate with another actor implemented in a traditional OOP design. That’s really great news, as this means you can utilize functional programming practically for a subset of an application without any compromise. So if you want to start slowly for whatever reason, you can!

## Conclusions

It turns out that the actor model is perfectly suited for implementing interconnected core–shell pairs. Meaning also in the context of the *functional core – imperative shell* architecture, it's a great tool for achieving clear separation of concerns.

In addition the actor model helps bridge clean functional design with other programming paradigms. I’ve found this especially valuable as a practical way to introduce functional programming principles incrementally into my own working environment.

So, whether you want to improve your existing functional architecture or utilize functional programming in the first place, this is for you.
