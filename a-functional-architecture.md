## Introduction

Functional programming is about utilizing pure functions. So by putting the business logic into these functions that per definition don’t have side effects many things are getting much easier (e.g. testing as described in [[P01 - From object oriented to functional programming]]). However at some point any application must have side effects like handling IO, maintaining internal state or spawning In other words: An application without any effect to the outside world would be quite useless. So you might have already noticed the elephant in the room: How to enable pure functions in having side effects eventually? Putting this question in a concrete example: How can a pure function write a log message?

## The Elephant 

Actually the high level answer is surprisingly simple: These pure functions have a caller that is handling the side effects based on their results, meaning the pure function creates the message its caller then puts it to stderr. For this post, let’s stay on the higher level and clarify what it means architecturally. 


## A Functional Architecture

The *functional core - imperative shell* concept is clarifying exactly this by separating an application into two parts, the functional core that represents all the pure functions that implement the business logic and the imperative shell that actually calls the core and handles side effects. The same idea is also known as *Ports and Adapters* or *Sandwhich*. 

*Imperative Shell*: So, for a C++ developer the shell is something familiar. There everything is allowed to happen, you can utilize traditional C++ at it’s best, e.g. utilize the standard library to write to stderr, make use of various protocol stacks to communicate with other systems, mutate private class members to maintain state or even setup the execution environment to handle concurrency. The only constraint here is: Use this freedom for handing side effects only. Don’t implement any business logic here as that’s what the functional core is for. 

*Functional Core*:  Every decision on business level must be encoded in pure functions. All these functions then form the core. You are free to compose them as you like, as any composition of pure functions is itself a pure function as well. So you can structure the core into different levels of abstraction and this way organize the overall business logic nicely.

One important design aspect I want to highlight is that the core is self contained, meaning the shell depends on the core but not the other way around. This is especially important as it allows testing of the core in isolation of the any shell.

## Summary 

That’s basically already it. Now you have an idea where the borderline lies and how the two pieces separated by it look like on abstract level. You want it more concrete? Check my post [[P03 - Actors as Shell]] where I dive deep into a real world code example that clarifies this idea on coding level.