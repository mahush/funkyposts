
### Introduction

This post belongs to the *funkyposts* blog, where I explore functional programming patterns applicable in a C++ environment and grounded in clear code examples.

Pure functions are at the hearth of functional programming. So, if you want to go functional and in turn gain its benefits you must put your logic into functions that are free if side effects. This is straightforward until you want side effects—like state—to come into play.

This post shows how to deal with state on coding level and in turn clarifies its location within the *functional core - imperative shell* architecture.

### The Design Idea

In fact, the idea is quite simple: The state lives in the shell, passed to the core‘s functions and updated with their results.

Let's dive into an example from *funkysnakes*, so that it’s getting concrete. The `GameEngine` actor holds the `GameState` struct that aggregates various sub states.

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

There is a pure function `moveSnakes` relying on the sub-states `snakes`, `board` and `food_items`. It is responsible for advancing the snakes in the game by one step. Therefor the `snakes` state is mutated while the `board` and `food_items` state is just read. For more details on the implementation see the code itself.
```c++
PerPlayerSnakes moveSnakes(PerPlayerSnakes snakes, const Board& board, const FoodItems& food_items);
```

Eventually `moveSnakes` is called within the game loop by the `GameEngine` actor.

```c++
state_.snakes = moveSnakes(state_.snakes, state_.board, state_.food_items);
```

Now that we can point to some code, let's sort things out. 

First, the `moveSnakes` function itself belongs to the core, for sure as that is what the core is about - pure functions. 

Second, the Sub-State data structures `PerPlayerSnakes`, `Board` and `FoodItems` are also part of the core. This is because according to the *functional core - imperative shell* architecture, there is no dependency from core to shell, instead the core is self contained. This way the logic encapsulated by `moveSnakes` can be implemented and tested completely decoupled from the shell.

Third, the instantiated `GameState` within the `GameEngine` actor belongs to the shell. The same applies for the actual call of `moveSnakes`. Thus managing state by invoking core functions is a shell responsibility. 

Forth, it's interesting to take a closer look at how shell and core perceive state. From the shell's point of view, the `GameState` is data persistent across multiple calls and mutated by calls like `moveSnakes`. So persisting and mutating is what make data to be state. But from the core's point of view, however, there's no notion of state - only data passed in and potentially returned. This is the magic that allows pure functions to eventually mutate state.

Fifth, naturally there is high flexibility in which state could be processed by which function. Here the `snakes` sub-state is mutated, but depends on the `board` and the currently existing `food_items`. As you can see, whatever data a pure function needs can simply be passed in by the shell.
### Summary
 In the context of the *functional core – imperative shell* architecture, the core defines pure functions and the data structures they operate on, while the shell invokes these functions— passing in the current state as data and updating that state with the returned data.

 This separation keeps the core self‑contained and lets the shell handle persistence. Together, they create a flexible, composable system where pure logic and controlled mutation coexist cleanly.

### What's next?
The example here focused on *domain‑level state*. However, modules that maintain their own internal state introduce another level of abstraction. The post xxx will explore these *module‑internal states* and show how to handle both kinds of state cleanly.
