# (What) To Test or Not To Test

https://dzone.com/articles/unit-testing-guidelines-what-to-test-and-what-not

## To Test

- Collections passed as parameter not changed in the method
- Algorithm Engines
- Utility methods
- Core business logic methods
- Simple DB queries checking predicates
- Services that are high-risk

## Not To Test

- Constructors or properties (if they just return variables). Test them only if they contain validations.
- Configurations like constants, readonly fields, configs, enumerations, etc.
- Facades of just wrapping other frameworks or libraries
- Container service registrations
- Exception messages
- **[POCO classes](https://stackoverflow.com/questions/16075245/what-is-poco-in-entity-framework)** — models, etc.
- .NET Core/Framework logic- like default parameters
- Private methods directly
- Complex SQL Queries (more than 3 joins or grouping, etc.). Better to test it with manual or some kind of system test against real DB.
- ASPNET.Core controller methods
- Complex multi-threading code (it is better to be tested with integration tests)
- Methods that call another public method

## What is a good unit test?

https://www.toptal.com/qa/how-to-write-testable-code-and-why-it-matters

* Easy to write
* Readable
* Reliable
* Fast
* ~~Truly unit, not integration~~ Not external.





https://softwareengineering.stackexchange.com/questions/750/what-should-you-test-with-unit-tests

1. Test the common case of everything you can. This will tell you when that code breaks after you make some change (which is, in my opinion, the single greatest benefit of automated unit testing).
2. Test the edge cases of a few unusually complex code that you think will probably have errors.
3. Whenever you find a bug, write a test case to cover it before fixing it
4. Add edge-case tests to less critical code whenever someone has time to kill.



## My two cents

Be aware of accessibility, portability, security.