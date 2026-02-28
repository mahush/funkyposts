
### Introduction

This post belongs to the *funkyposts* blog, where I explore functional programming patterns applicable in a C++ environment and grounded in clear code examples.

Pure functions are at the heart of functional programming. So, if you want to go functional and in turn gain its benefits you must put your logic into functions that are free of side effects. This is straightforward until you want side effects—like state—to come into play. I was raised in an OOP world where state is by design tightly coupled to functions. While it's not that hard, it took me a while to understand how to effectively separate functions and their state.

I found the *functional core - imperative shell* architecture especially helpful to sort things out. So this post shows what state handling can look like when following this architectural idea.

### The Design Idea

Here's a quick reminder of the *functional core - imperative shell* architecture: It requires code to live either in the shell or in the core. The shell handles side effects like IO, state or timers in an imperative way. The core contains the business logic implemented as pure functions.

But where is state supposed to be located in this architecture? Actually it's quite simple: The state lives in the shell, passed to the core‘s functions and updated with their results.

Let’s dive into an example from *funkysnakes*, so that it’s getting tangible. The `GameEngineActor` holds the `GameState` struct that aggregates various sub states. By the way, you can find the complete code in [the funkysnakes github repository](https://github.com/mahush/funkysnakes).

```c++
class GameEngineActor : public Actor<GameEngine> {
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

There is a pure function `moveSnakes` relying on the sub-states `snakes`, `board` and `food_items`. It is responsible for advancing the snakes in the game by one step. Therefore the `snakes` state is mutated while the `board` and `food_items` state is just read.

```c++
PerPlayerSnakes moveSnakes(PerPlayerSnakes snakes, const Board& board, const FoodItems& food_items);
```

Eventually `moveSnakes` is called within the game loop by the `GameEngineActor`.

```c++
state_.snakes = moveSnakes(state_.snakes, state_.board, state_.food_items);
```

Now that we can point to some code, let's sort things out. 

First, the `moveSnakes` function itself belongs to the core, because that is what the core is about - pure functions. 

Second, the Sub-State data structures `PerPlayerSnakes`, `Board` and `FoodItems` are also part of the core. This is because according to the *functional core - imperative shell* architecture, there is no dependency from core to shell, instead the core is self-contained. This way the logic encapsulated by `moveSnakes` can be implemented and tested completely decoupled from the shell.

Third, the instantiated `GameState` within the `GameEngineActor` belongs to the shell. The same applies for the actual call of `moveSnakes`. Thus managing state by invoking core functions is a shell responsibility. 

Fourth, it's interesting to take a closer look at how shell and core perceive state. From the shell's point of view, the `GameState` is data persistent across multiple calls and mutated by calls like `moveSnakes`. So persisting and mutating is what makes data state. But from the core's point of view, however, there's no notion of state - only data passed in and potentially returned. This is the magic that allows pure functions to eventually mutate state.

Fifth, naturally there is high flexibility in which state can be processed by which function. Here the `snakes` sub-state is mutated, but depends on the `board` and the currently existing `food_items`. As you can see, whatever data a pure function needs can simply be passed in by the shell.
### Conclusions
 
 Let's recap where state is placed in the *functional core – imperative shell* architecture. So, the core defines pure functions and the data structures they operate on, while the shell invokes these functions— passing in the current state as data and updating that state with the returned data.

 This separation keeps the core self‑contained and lets the shell handle persistence. Together, they create a flexible, composable system where pure logic and controlled mutation coexist cleanly.

#### Transparency
I really like this design for different reasons. First of all there is this great transparency of the existing state. It is not buried somewhere deep but it's visible at the top level. So it's quite unlikely that you will be surprised by behavior based on state you didn't have on your radar. With deeply nested OOP classes this is really a different story.

#### Testability
In my experience testing stateful code often comes with a lot of complexity just because in order to test for a specific behavior you must somehow first get your software in exactly that state which is the starting point for making the behavior to test appear. Usually you either use the regular API to advance to the desired state or you introduce some test specific API or mocks. But if your logic is just implemented by pure functions you are free to provide whatever state you want to start from, just naturally. It's as simple as it can get. Of course, you also want to test the shell's persisting and mutating of state. But this is only an integration test that is independent of any specific logic, so the test cases here are still simple.

### What's next?
The example here focused on *domain‑level state*. However, modules that maintain their own internal state introduce another level of abstraction. The post xxx will explore these *module‑internal states* and show how to handle both kinds of state cleanly.
