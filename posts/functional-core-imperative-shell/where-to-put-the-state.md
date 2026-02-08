### Introduction

This post is part of my *functional core - imperative shell architecture series*, where I explore functional programming principles while anchoring them by clear code examples.

I feel pure functions form the very center of functional programming. So, if you want to go functional and in turn gain all its benefits you must put your logic into functions that are pure. This is straightforward until your logic relies on state. 

This post shows where to put the state on coding level and in turn clarifies its location within the *functional core - imperative shell* architecture .

### The Design Idea

In fact, the idea is quite simple: The state is held by the shell and is passed to the core where needed. Passing here means either (1) just provide the state as argument for readonly access, or (2) in addition return the potentially mutated state.

Let's see it in action. In funkysnake the `GameEngine` actor holds the `GameState` struct that aggregates various sub states. This data is part of the shell.

```c++
class GameEngine : public Actor<GameEngine> {
  ...
  
  GameState state_;
};
```

```c++
struct GameState {
  PerPlayerSnakes snakes;
  FoodItems food_items;
  Board board;
  ...
};
```

In contrast, the pure function mutating `snakes` and reading `board` and `food_items` is part of the core:
```c++
PerPlayerSnakes moveSnakes(PerPlayerSnakes snakes, const Board& board, const FoodItems& food_items);
```

But calling `moveSnakes` belongs again to the shell, as the code lies in scope of the actor where the state is accessible:

```c++
state_.snakes = moveSnakes(state_.snakes, state_.board, state_.food_items);
```


Pure functions and data naturally belong together — data provides the input and output, and this tight relationship is what makes composition possible. The more freely data can be passed around, the more flexible and composable your functions become (see the composability post for more details on this).

So, what does this mean for our state here? From the shell's point of view, the `GameState` is data persists across multiple calls and is mutated by calls like `moveSnakes`. From the core's point of view, however, there's no notion of state - only data passed in and potentially returned. In other words, the shell owns the state, but the data structures representing that state belong to the core. 

This setup fulfills a key principle of the *functional core - imperative shell* architecture: the shell depends on the core, but the core is self contained. The `GameState` struct is defined in the core but managed by the shell. The shell calls core functions, passing core data structs as arguments and receiving new data in return. This is the touch point between shell and core.

The design is straightforward to implement while remaining flexible about which functions process which data. In this example the `snakes` sub-state is mutated, but depends on the `board` (snakes wraps at the board's boundaries) and the currently existing `food_items` (a snake moving into food grows). As you can see, whatever data a pure function needs can simply be passed in, just the shell needs to provide it.
### Summary
The *functional core - imperative shell* architecture, assigns pure functions that take and return data to the core, while the shell manages state by invoking those functions.

 This separation keeps the core self‑contained and lets the shell handle persistence. Together, they create a flexible, composable system where pure logic and controlled mutation coexist cleanly.

### What's next?
The example here focused on *domain‑level state*. However, modules that maintain their own internal state introduce another level of abstraction. The post xxx will explore these *module‑internal states* and show how to handle both  kinds of state cleanly.
