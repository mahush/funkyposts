# Effects in Modern C++: Making Them Explicit

**How to pull side effects out of your core logic**

You are looking at an unfamiliar function and want to understand what it does. Its interface tells you what data it consumes and what result it produces. But it doesn’t tell you whether calling it also has other observable effects. Does it publish a message? Write a log entry? Send a network request? Update a database? To answer those questions, you usually have to read the implementation and follow the chain of function calls.

The *functional core – imperative shell* addresses exactly this problem by separating logic from observable effects. But what does this look like in practice?

If a pure function no longer performs observable effects itself, how does it express which ones should occur?
## How Effects Flow Through Core and Shell
The answer lies in treating the imperative shell as a translation layer. Observable effects never cross the boundary of the core directly. Only the shell observes or performs effects. However, from the core’s perspective, effects exist only as data:
- The shell translates *incoming effects*, such as received messages or elapsed timers, into data and passes it to the core.
- The core encodes *outgoing effects*, such as sending messages or starting timers, as data and returns them to the shell, which performs them.

```mermaid
flowchart LR
    W[Outside World]
    S[Imperative Shell]
    C[Functional Core]

W -->|Inputs| S
S -->|Data| C
C -->|Data| S
S -->|Outputs| W
```

This way, the core and the shell communicate exclusively through data, allowing pure functions to describe observable effects without performing them.
## Expressing Effects in Code
At the code level, the shell represents incoming effects as ordinary function arguments, while the core represents outgoing effects as ordinary return values.

The following function from the [funkysnakes project](https://github.com/mahush/funkysnakes/tree/v0.1.0)  project changes the game's tick rate. It receives a `TickRateChangeMsg`, which represents an incoming effect already translated into data by the shell. In response, the function updates the game state and returns two effect descriptions: one for restarting the game timer and one for writing a log message.

```cpp
std::tuple<GameState, 
           GameTimerCommand, 
           LogMsg> handleTickRateChange(GameState state, 
                                        const TickRateChangeMsg& msg) {
  state.interval_ms = msg.interval_ms;

  const auto timer_cmd = make_periodic_command(state.interval_ms);

  const LogMsg log_msg = {
      "Changing tick rate to " + std::to_string(msg.interval_ms) + "ms\n"};

  return std::make_tuple(state, timer_cmd, log_msg);
}
```

The function signature makes the complete behavior explicit. As [introduced in a previous post](mastering-state-in-modern-cpp-making-it-explicit), the updated state is returned explicitly. Likewise, the additional return values capture the requested effects, making them just as visible as the state transformation itself. Because these interactions are represented as ordinary data, the function remains completely pure—it neither restarts the timer nor writes the log message. It merely constructs the corresponding effect descriptions and returns them to the shell.

The shell then interprets each returned effect description and performs the corresponding observable effect.

```cpp
const auto [new_state, timer_cmd, log_msg] = handleTickRateChange(state, msg);

state = new_state;

handle(timer_cmd);
handle(log_msg);
```

In practice, manually unpacking and handling returned effect descriptions quickly becomes repetitive and can be generalized. Therefore the funkysnakes project, for example, uses a [small helper](https://github.com/mahush/funkysnakes/blob/405228db237ec75e65730c66192be96f1d2574ae/include/snake/process_helpers.hpp#L86) that treats the first tuple element as the returned state and the remaining elements as effect descriptions. The underlying idea, however, remains exactly the same.
## Making Effect Dependencies Explicit
Looking at the pattern through the dependency lens reveals an important property of this approach. The dependencies between the logic and observable effects are still there, but they are expressed very differently. By adopting the [functional core – imperative shell](handling-side-effects-in-modern-cpp-designing-systems-around-pure-functions) pattern they are no longer hidden in the implementation but explicit as part of the function signatures. This architectural shift offers several important benefits:

- A function's **behavior becomes completely visible** through the interface. Understanding a function no longer requires reading its implementation to discover which observable effects it may perform. Its interface tells the complete story—the data it consumes, the data it produces, and the observable effects it describes.
- Consequently, **testing the logic becomes simpler**. Because effects are passed as ordinary data, they can be inspected and verified without performing the effects themselves.
- Supporting **multiple effects is straightforward**, as a function can request any number of observable effects simply by returning additional effect descriptions.

Like [explicit state](mastering-state-in-modern-cpp-making-it-explicit), explicit effect descriptions don’t remove dependencies—they make them visible. As a result, understanding the impact a function may have no longer requires reading its implementation. This makes code easier to understand, reason about, and evolve because a function’s dependencies and behavior are apparent from its interface.


---
Part of the *funkyposts* blog — bridging object-oriented and functional thinking in C++.
Created with AI assistance for brainstorming and improving formulation. Original and canonical source: https://github.com/mahush/funkyposts (v01)
