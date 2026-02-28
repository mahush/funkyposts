- self contained
- have their internal state 
- the namespace caries the module name
- the state struct is just called State
- the client side should not care about internals so the state is referred to as module_name::State module_name_state
- Lifting module state to domain level

---
## Introduction

This post belongs to the *funkyposts* blog, where I explore functional programming patterns applicable in a C++ environment and grounded in clear code examples.

Handling state is a fundamental part of putting logic into code. When I started out as a C++ developer, the OOP approach—explicitly binding data to the functions that operate on it—felt natural and convincing. Maintaining state seemed to demand that structure.

Today I value the flexibility functional programming offers here: You can strictly associate a few functions with some data, but you don’t have to (see [[P01 - Why functional programming]]).

This post explores how some pure functions operating on a shared state can form a coherent module and what their state means from a client’s point of view.

## The Design Idea

The basic idea of a stateful functional module is to group pure functions that all depend on the same shared state. This might sound like a no brainer, but actually there are a few subtle details to discover ;-)
 
Let’s dive into some code from *funkysnakes* and this way point to the relevant details.





- This state might be on domain level or module internal depending on its level of abstraction. 
-  the nature of the module internal state and in turn clarifies when and how to utilize it.
- Think of a usual class in OOP terms as equivalent. Thus, it’s also reasonable to refactor a class into a functional module
- Module internal state has no meaning outside the module, so clients treat it like a black box, meaning they manage the state in terms of passing and updating but they don‘t interpret it
- Module internal state promotes encapsulation. This is the equivalent of a class in an OOP world.
- Clarifying that the module is stateful while it’s pure functions are stateless

## Summary 



---
AI Summary:

● Architectural Principle: Self-Contained Modules with Opaque State

  Core Idea

  When designing functional modules that thread state explicitly, maintain strong encapsulation boundaries by treating module state as opaque at the domain level.

  Key Principles

  1. Module Owns Its State Type

  - Internal state types (like PerPlayerDirectionQueue) should be defined within the module, not at doma
in level
  - Wrap internal representation in a module-specific State struct
  - Domain code should never directly access or understand the internal structure

  Example:
  // In direction_command_filter.hpp (module level)
  namespace direction_command_filter {
    // Internal type - not exposed to domain
    using PerPlayerDirectionQueue = std::map<PlayerId, std::deque<Direction>>;

    // Opaque state wrapper
    struct State {
      PerPlayerDirectionQueue queues;  // Implementation detail
    };
  }

  // In game_messages.hpp (domain level)
  struct GameState {
    direction_command_filter::State direction_command_filter_state;  // Opaque!
    // Domain code cannot see the queues inside
  };

  2. Naming Signals Ownership

  At the domain level, use explicit naming to make it obvious that state belongs to a specific module:

  - Type name: Use fully qualified module namespace (direction_command_filter::State)
  - Variable name: Use module prefix (direction_command_filter_state)

  This immediately communicates: "This is not domain-level state with semantic meaning—this is internal 
state that belongs to a specific module."

  Anti-pattern:
  struct GameState {
    PerPlayerDirectionQueue pending_directions;  // ❌ Exposes implementation
  };

  Correct pattern:
  struct GameState {
    direction_command_filter::State direction_command_filter_state;  // ✓ Opaque ownership
  };

  3. Module Manages Its Own Lifecycle

  Since the module owns the state, it should handle:
  - State initialization (lazy or explicit)
  - State validation
  - State transformations

  Domain code should never directly construct or manipulate module state—only pass it through module fun
ctions.

  Example:
  // Module handles lazy initialization internally
  State try_add(State state, const PerPlayerSnakes& snakes, const DirectionCommand& cmd) {
    // Lazy init: create queue if player doesn't exist
    auto [queue_it, inserted] = state.queues.try_emplace(cmd.player_id, std::deque<Direction>{});
    // ... rest of logic
  }

  4. Separation of Concerns in Domain Operations

  Domain-level operations (like addPlayer) should only handle domain concerns (snakes, scores), not modu
le-internal state.

  Before (coupled):
  std::tuple<PerPlayerSnakes, PerPlayerScores, PerPlayerDirectionQueue>
  addPlayer(..., PerPlayerDirectionQueue pending_directions) {
    // ... create snake and score ...
    pending_directions[player_id] = std::deque<Direction>{};  // ❌ Domain initializing module state
    return {snakes, scores, pending_directions};
  }

  After (decoupled):
  std::tuple<PerPlayerSnakes, PerPlayerScores>
  addPlayer(...) {
    // Only handles domain concerns (snakes, scores)
    // Module initializes its own state when needed
    return {snakes, scores};
  }

  Benefits

  1. Information Hiding: Domain cannot depend on module implementation details
  2. Easier Refactoring: Module can change internal representation without touching domain code
  3. Clear Boundaries: Module prefix makes ownership and responsibilities obvious
  4. Testability: Modules can be tested independently with their own state
  5. Scalability: Pattern scales to multiple modules with their own state

  When to Apply

  Use this pattern when:
  - Creating a functional module (stateless functions that transform state explicitly)
  - The module has internal state structure that domain shouldn't know about
  - You want strong encapsulation despite explicit state passing
  - The state is only meaningful within the module's context

  Guidelines for Future Modules

  1. Define state types inside the module namespace
  2. Wrap implementation in a ModuleName::State struct
  3. Use module_name::State module_name_state at domain level
  4. Module functions handle their own state lifecycle
  5. Domain operations don't initialize or manipulate module state directly

  This architectural pattern allows us to maintain functional programming benefits (explicit state) whil
e preserving object-oriented encapsulation principles (information hiding, clear boundaries).

--

When putting some logic in a pure way, a straightforward implementation often leads to multiple pure functions that operate on shared state. 

I guess exactly for that reason the OOP approach which explicitly ties data to functions felt so natural and in turn so convincing back then when i started my journey as C++ dev. 
OR