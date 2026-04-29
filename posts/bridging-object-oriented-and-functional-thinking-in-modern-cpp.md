# Bridging Object-Oriented and Functional Thinking in Modern C++

*How dependencies make C++ systems hard to test and evolve—and why functional thinking changes it*

Fighting complexity is crucial if you want to succeed in software development. In many real-world C++ projects, however, systems tend to evolve in the opposite direction. Components become tightly coupled, so changes ripple through large parts of the system. State is scattered, reducing transparency about how it evolves over time. Behavior emerges from many interacting parts, making it hard to reason about individual pieces in isolation. 

This also shows up in testing: a significant amount of boilerplate and indirection is needed just to enable it. Establishing specific system states requires substantial setup, and maintaining tests becomes costly, as even small production changes force updates across large parts of the test code.

The result is a system that is hard to get right—and once it works, it feels rigid and difficult to evolve.
## Where OOP Leads to Complexity 
The underlying problems unfold nicely when jumping into the details from the testing point of view. So, let's focus on unit-testable code, that is code structured in smaller parts that can be executed in isolation. To get there we apply the “separation of concerns” principle, which provides the units for testing. And to actually run modules independently, dependency injection comes into play. This means if one module depends on another, it is passed in, normally as a constructor argument. In a unit test where a single module should run in isolation, all dependent modules need to be mocked. So, instead of real dependencies, the test passes its mocks as constructor arguments.

This reveals the first issue: **No testing without mocking**. Technically that mocking approach works well—unit testing is enabled. But actually it comes at a high price. The mocks need to be written and maintained, which increases test-specific code and in turn leads to higher test complexity. And we should not neglect this, as only if all the mocks are implemented correctly, the test is helpful.

Mocks must implement the same interface as the real components they replace, which leads to another problem: **Interfaces create tight coupling between alternative implementations**. Often these interfaces contain several interdependent function signatures with non-trivial pre- and post-conditions. Any change affects all implementations and thus also all mocks, which increases maintenance effort. With dependency injection and many mocks, this interface-level coupling becomes especially visible and expensive. So, we often trade testability for flexibility here, which can be a poor deal.

But the challenges don’t stop at interfaces. Once state comes into play, things get even more complicated: **State encapsulated within a class is hard to modify by a test**. In traditional OOP, private mutable state is fully hidden, so tests cannot set it up directly. A test that needs the object in a specific internal configuration must drive the state there indirectly through the public interface, which often requires multiple method calls, complex sequences, and mocks. This indirect setup adds complexity and makes tests more brittle.

Actually, state handling in a traditional OOP manner has another problematic dimension: **Generally state is cluttered across the object graph**. This introduces state dependencies that are hard to see. The more stateful objects exist, the harder it gets to reason about how state evolves in the system. Of course, this compounds the state-related test complexity mentioned earlier.

Interestingly, testing just makes these problems visible—but they exist in the design itself. E.g. the tight coupling of implementations sharing an interface can be described more generally as: **Inheritance creates tight coupling within the hierarchy**. So, once a class hierarchy is established, the base class interface becomes almost impossible to change without impacting every derived class. This gets worse the deeper the hierarchy is. Even small adjustments propagate through, making class hierarchies inflexible and expensive to modify.

Let's step back and draw conclusions. All these problems create a lot of complexity. This way they cause the pain described in the beginning. But there is more to understand here: **The root cause is dependency**—complexity emerges as different kinds of dependencies accumulate: 
- components dependent on each other based on injection can only be executed in isolation by introducing mocks
- the broader an interface, the more complex the dependency between components sharing it
- inheritance causes dependencies between classes within hierarchies
- hidden, distributed, and evolving state creates implicit dependencies across the system

Every issue we looked at comes down to this: dependencies force parts of the system to change together, to be set up together, and to be understood together. As they reinforce each other, complexity grows increasingly fast.
## What Functional Thinking Unlocks 
So, I started questioning the design ideas I was following for years and searched for different ways of structuring my code to better manage these dependencies. The blog post [Mocking is Code Smell](https://medium.com/javascript-scene/mocking-is-a-code-smell-944a70c90a6a) helped me see this more clearly. It also pushed me to explore functional ideas that turned out to be particularly useful. Put simply, functional programming offers techniques that can complement a traditional C++ toolbox.  

These techniques work because they change how we design systems—and with that, which dependencies emerge. To get an idea of what changes, consider pure functions as building blocks for your logic:
- Pure functions receive all dependencies explicitly as input, instead of relying on injected objects. This eliminates implicit dependencies and significantly reduces the need for mocking.
- In a world of pure functions, there is no hidden state, so dependencies on state are always explicit and visible.
- Function interfaces are typically narrower than class interfaces, which keeps dependencies simpler.
- There is no inheritance hierarchy, removing an entire class of dependencies 

In conclusion, when you compose your business logic out of pure functions, dependencies become explicit, fewer, and simpler. This directly mitigates complexity.
The design becomes clearer, and as a result, reasoning, testing, and maintenance improve.

Just to be explicit, I am not saying functional programming is going to solve all problems, nor that it’s applicable in C++ without limits. I am saying there are aspects that are highly valuable when designing C++ systems. So, I advocate for complementing OOP with FP where appropriate.
## If This Resonates
Adopting a different way of structuring code takes effort, and how much depends on your learning path. If you’re coming from an OOP-heavy, C++-style background like I did, I might speak your language well enough to further clarify these techniques and design choices. 

My original motivation wasn’t to write about system design or functional programming. I simply wanted to figure out how to apply these ideas effectively in real-world C++ code. After exploring this for a while and finding techniques that work, it feels natural to share and discuss them. 

The funkyposts blog is meant to build a bridge between traditional C++ and functional programming by illustrating practical FP patterns in modern C++. The goal is to provide concrete ways to improve how systems are structured—while staying grounded in real-world constraints. I also welcome feedback and different perspectives to further refine these ideas.
## Dive deeper
The next step is to leverage these insights in practice—improving existing designs without rewriting everything. The subsequent posts in this series show how.

- **[Handling Side Effects in Modern C++: Interfacing Pure Functions with Our Imperative World](handling-side-effects-in-modern-cpp-interfacing-pure-functions-with-our-imperative-world.md)** — Introduces the functional core–imperative shell architecture
- [When One Shell Isn’t Enough: Scaling the Functional Core–Imperative Shell Pattern with Actors in C++](when-one-shell-isnt-enough-scaling-the-functional-core-imperative-shell-pattern-with-actors-in-cpp) — How to structure growing C++ systems into multiple actor-driven core–shell pairs
- More posts in this series coming soon

---
Part of the *funkyposts* blog — bridging object-oriented and functional thinking in C++.
Created with AI assistance for brainstorming and improving formulation. Original and canonical source: https://github.com/mahush/funkyposts (v06)
