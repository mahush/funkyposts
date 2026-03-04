## Introduction

This post belongs to the *funkyposts* blog, where I explore functional programming patterns applicable in a C++ environment and grounded in clear code examples.

Modularity is essential for managing complexity. In the [[actors-as-shell]] post, I discussed this idea in the context of dividing an application at a high level. The same principle applies at lower levels as well—for example, when isolating self-contained pieces of logic into modules. Since logic typically comes with state, encapsulating logic within a module naturally means encapsulating state there too.

Object-oriented programming does exactly this all the time: each class has functions and data these functions are operating on. Data that is mutated becomes state. And so eventually a class encapsulates state. It's something that happens naturally.

I discussed how to generally combine pure functions with state in [[where-to-put-the-state]], but without any encapsulation. Instead state was publicly available and thus could be mutated by anyone. Sometimes we want this flexibility, but sometimes we only want state to be module local. So, sometimes we want OOP-like encapsulation in a functional programming context. How to get there?

So, this post explores how pure functions operating on a shared state can form a coherent stateful module that effectively encapsulates state.

## The Design Idea

The basic idea of a stateful functional module is to group pure functions that all depend on the same shared state together with their state. This might sound like a no brainer, but actually there are a few subtle details to discover here ;-)

Let’s dive into some code from *funkysnakes* and spot these subtle details along the way.

Snakes are controlled via the arrows keys. But the game loop and key events are asynchronous, so at the beginning of each game loop tick each snake's movement direction is updated based on  new key events since the last game loop tick. This "direction update" logic is implemented in the `direction_command_filter` module. As the name suggests the logic is implemented in terms of filtering key press events.

No surprise, this logic requires state that is a queue of directions per player:

```cpp
namespace direction_command_filter {
struct State {
	using PerPlayerDirectionQueue = std::map<PlayerId, std::deque<Direction>>;
	PerPlayerDirectionQueue queues;
};
}
```

The `direction_command_filter` module's interface provides the function `tryAdd` that simply adds another direction command (basically a key press event) to the filter. The function `tryConsumeNext` takes the next direction that passed the filter out of the queue. Both methods may adjust the state:

```c++
namespace direction_command_filter {

State try_add(State state, const PerPlayerSnakes& snakes, const DirectionCommand& cmd);

std::tuple<State, PerPlayerDirection> try_consume_next(State state);
}
```

As pointed out in [[where-to-put-the-state]], the pure functions are called by the shell passing in the current state as data and updating that state with the returned data. So all the state is handled by the `GameEngineActor` which here means the module state `direction_command_filter::State` as well as the general state `PerPlayerSnakes`:

```c++
namespace shell {
struct GameState {
	...
	PerPlayerSnakes snakes;
	direction_command_filter::State direction_command_filter_state;
};
  
class GameEngineActor : public Actor<GameEngineActor> {
	...
	GameState game_state_;
};
}
```

The `GameEngineActor` then calls `try_add` and `try_consume_next`:

```c++
state_.direction_command_filter_state = direction_command_filter::try_add(state_.direction_command_filter_state, state_.snakes, new_command);

state_.direction_command_filter_state = direction_command_filter::try_consume_next(state_.direction_command_filter_state);
```

All right, as advertised, now a few insights on this design:

*Class Equivalent*: Generally following this pattern a stateful class can be converted into a stateful functional module. I feel this is especially helpful as it bridges between the object oriented and the functional world. So when transitioning into functional programming just start with taking your modules with you.

*Self Contained Module*: The code in the `direction_command_filter` namespace make the module. By defining its functions and internal state it's self contained and as such can be unit tested in isolation.

*Namespace Scope*: Note that the namespace gives scope to the functions exactly as a class name would do otherwise. In turn the module boundaries are clearly visible at client side calls. Also it's sufficient to call the module's state simply `State`.

*Effective Encapsulation*: The module's state is only modified by the module's functions itself. This is the essence of encapsulating state as provided by private class member variables in OOP context. Please note that the shell managing the persistence of this module internal state is not contradicting as the shell only applies modification created by the module's functions. The shell does not modify state on its own behalf. From the shell's perspective, module state is a black box, although it stores and threads it through module functions but never peeks inside.

*Testability*: Although the state is encapsulated it's not hidden. When calling the module's pure functions we can easily pass arbitrary state in and observe the resulting state. So testing works the same as described in [[where-to-put-the-state]], which means stateful modules are perfectly testable. I love it.

*Module Internal State vs Domain Level State*: Notice that `try_add` receives two different kinds of state: `direction_command_filter::State` (module internal) and `PerPlayerSnakes` (domain level). Module internal state is data that only the `direction_command_filter` functions understand. In contrast the domain level state has meaning across the entire game domain, so many parts of the system understand what a snake is and operates on this state. The filter module needs to read it (to check current direction) but doesn't own it. This differentiation is quite important as the level defines which functions can interpret the state. The key point here is: domain logic functions must not directly operate on and thus not interpret module internal state. Therefore the internal state's name on domain level is just `direction_command_filter_state` which only indicates that it belongs to the `direction_command_filter` module but effectively hides its internals.

Sharing these different perspectives on that design should help you to get a deeper understanding of the implementation details and their consequences such that you see clearly how to apply this pattern by yourself. 
## Summary 

OOP naturally provides encapsulation of data in context of functions. Besides many weaknesses of object oriented design I feel this encapsulation generally is really a strength. So I am happy that this idea is compatible with functional programming. To be fair, only the class's data encapsulation is perfect in the sense that there is really no way to access a private member from outside the class (unless you make explicit exceptions via friend declarations). In the presented stateful functional module design the encapsulation is only based on the described discipline but in turn we gain great testability which I feel is a great trade off.

Now it's your turn, give it a try an feel the magic of building a stateful functional module out of stateless functions!
