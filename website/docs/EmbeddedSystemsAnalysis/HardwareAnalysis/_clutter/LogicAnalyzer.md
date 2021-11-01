# Logic Analyzer

Logic analyzers are used to measure logical or digital values in a circuit. 

Terminology:

- Channel - A logical input to the analyzer. One channel per wire, probe, or bit.
- Trigger - A set of conditions upon which the logic analyzer will start recording data. The conditions can be levels of signals, a signal transition, a predefined value occuring on a set of channels, a count of some condition, or a duration of some condition.
- Probe - Connects to the signal to measure to provide a solid connection.
- Samples
- Sample Rate - Number of measurements the logic analyzer takes per second.
- Threshold - The voltage above which is considered a logical one and below which is considered a logical zero.

<!-- TODO: Show example of low level, rising edge, high level, and the threshold. Show this information from the datasheet. Students should answer the threshold question. -->

## Sampling

Sampling rate is accuracy of measurement, changes could happen between sampling and miss changes entirely. To get all changes, the logic analyzer frequency must be twice the rate of the line being measured.

<!-- TODO: Show the reality of a digital signal. -->
<!-- TODO: Show what a bounce in the signal looks like. -->

<!-- TODO: Do the logic analyzer lab. -->


The logical values are usually zero or one. Many logic analyzers have multiple channels (i.e. probes) so you can measure a full bus of data. Logic analyzer software usually provides decoders to interpret the data collected.

<!-- TODO: Mention the frequency, samples, and triggers. -->

## Pull Ups / Pull Downs


## Controlling LED With GPIO


## Comparing OScope to Logic Analyzer

