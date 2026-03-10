## Introduction

In the first years of my career I aimed for deeply internalizing OOP as provided by C++98. What I knew about programming at that time brought me to the conclusion that writing hight quality code is just a matter of being fluent in the language, the object oriented paradigm and the design patterns around it. So, I was practicing, and while the years have been passing by and I my ability to write idiomatic objects oriented code improved I began to see its limits.

To better understand my journey here, let me share another complementing learning path of mine that is about testing. The first embedded projects I joined didn’t had any automatic tests. Instead testing was done manually by just using the device in terms of observing its behavior and pressing its buttons. We developers did so by ourselves to see if the change we implemented worked and a dedicated test department did so all day to „ensure“ the device generally behaves as expected. In a later embedded project two colleagues were practicing unit testing for their production code. With my own experience in mind on how many regressions we had and how much effort it was to fix them in coordination with the test department, I realized the potential of automated tests. So, I started writing unit tests myself. At that time the OOP patterns I was applying became limiting.

## The Limits of OOP 

When diving into unit testing an essential learning was: If you want to unit test your code, you actually must write your code to be unit testable. In short, you must be able to execute smaller parts of your code in isolation. That is applying the „separation of concerns“ principle, which provides the units for testing. And to actually run modules independently, dependency injection comes into play. Meaning if one module depends on another it is passed in, normally as constructor argument. In a unit test where a single module should run in isolation all dependent modules need to be mocked. Instead of real dependencies, the test passes its mocks as constructor arguments.

*No testing without mocking*: Technically that mocking approach works well, unit testing is enabled. But actually it comes at a high price. The mocks need to be written and maintained which increases test specific code and in turn leads to higher test complexity. And we should not neglect it as only if all the mocks are implemented correctly the test is helpful.

*Interfaces create tight coupling between alternative implementations*:
Mocks must implement the same interface as the real components they replace. These interfaces often contain several interdependent function signatures with non‑trivial pre‑ and post‑conditions. Any change affects all implementations and thus also all mocks, which increases maintenance effort. With dependency injection and many mocks, this interface‑level coupling becomes especially visible and expensive. So, we often trade testability for flexibility here which can be a poor deal.

*State encapsulated within a class is hard to modify by a test*: In traditional OOP, private mutable state is fully hidden, so tests cannot set it up directly. A test that needs the object in a specific internal configuration must drive the state there indirectly through the public interface, which often requires multiple method calls, complex sequences, and mocks. This indirect setup adds unnecessary complexity and makes tests more brittle.

Kudos to a blog post called „Mocking is code smell“ that helped me a lot in better understanding these issue and how functional programming would allow to do better. This really catched me. My interest in functional programming was born. 

When looking at OOP from a FP perspective one more issue got apparent to me, that is the concept of inheritance.

*Inheritance creates tight coupling within the hierarchy*:
Once a class hierarchy is established, the base class interface becomes very difficult to change. Every derived class relies on it, so even small adjustments propagate through the entire hierarchy. All subclasses must be updated and there’s a high risk of breaking behavior in places far away from the original change. This makes class hierarchies rigid and expensive to evolve.

So, these were my pain points and I was primed to find solutions in functional programming and so I did.

## functional programming to the rescue 

The game‑changing key idea in functional programming is the pure function. A pure function is as simple as it gets: it takes input and returns output, with no hidden state and no implicit dependencies. When you apply this style to your business logic, things become clean and predictable. This makes testing straightforward, you call the function with test data and check the result. No hidden state means no complicated setup, and no implicit dependencies mean you don’t need objects standing in for other objects.

You may need to supply a function as an argument when testing. But this “mock” is just a single, stateless function, not an entire class with multiple methods and internal state. The complexity drops dramatically.

So the takeaway is this: when you structure your logic as pure functions, the heavy mocking simply disappears.

Of course also the class hierarchy coupling goes away with FP, still functionality is build on top of each other, but when this essentially means composing pure functions all dependencies are only on function signature level which leads again in dropping complexity.
### Outlook 

Sure thing, learning a new programming paradigm takes sustained effort, and how much depends on your learning path. If you’re coming from an OOP‑heavy, C++‑style background like I did, I might speak your language well enough to make functional programming feel more approachable. My original motivation wasn’t to teach FP. I simply wanted to figure out how to apply functional ideas effectively in real‑world C++ code. After exploring this for a while and finding techniques that work for me, it feels natural to share and discuss them. This blog is my attempt to build a bridge between traditional C++ and functional programming by illustrating practical FP patterns in modern C++. Hopefully this helps other C++ developers go more functional while inviting constructive feedback on my own understanding.
