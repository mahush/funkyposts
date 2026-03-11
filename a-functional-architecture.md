## Introduction
Functional programming is about utilizing pure functions. By putting the business logic into these functions, which by definition are free of side effects, many things become easier (e.g. testing as described in [[P01 - From object oriented to functional programming]]). However, at some point any application must have side effects like handling IO, maintaining internal state, or spawning timers. In other words: an application without any effect on the outside world would be quite useless. So you might have already noticed the elephant in the room: how can pure functions eventually cause side effects?

## The Elephant
The high‑level answer is surprisingly simple: pure functions let someone else perform side effects for themselves. Therefore, they return data describing what should happen, and their caller performs the effects. So, effect related behavior is still happening as usual it’s just places on the call side. For example, a pure function decide on creating some log message, and the caller connects to the outside world by putting it to stderr. Let’s stay on this higher level and clarify what that means architecturally.

## Functional Core - Imperative Shell 
The *functional core – imperative shell* concept formalizes this nicely: an application is split into a functional core (pure business logic) and an imperative shell (which calls the core and performs side effects). The same widely known idea is also called *Ports and Adapters* or *Sandwich* architecture.

*Imperative Shell*: For a C++ developer this part is familiar. Here anything effectful is allowed: using the standard library to write to stderr, using protocol stacks to communicate with other systems, mutating private members to maintain state, or setting up concurrency. The only constraint: use this freedom solely for handling side effects. Don’t implement business logic here.

*Functional Core*: Every business decision is encoded in pure functions. These functions together form the core. You can compose them freely, and compositions remain pure. This lets you build various layers of abstraction and organize the business logic cleanly.

One important design aspect I want to highlight here: the core is self‑contained. So while the shell depends on the core, the core is independent of the shell. This enables testing the core in complete isolation from any shell.

## Summary
That’s basically it. Now you know where the boundary lies and how both sides look at an abstract level. Want something more concrete? Check my post [[P03 - Actors as Shell]] where I dive into a real‑world code example hitting many interesting details.