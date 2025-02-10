# adapt-esdc-simulation

**Simulation** is a *question/action component* for Adapt.

The Systems Simulation Component is an effective tool for creating interactive, hands-on simulations that allow learners to practice data entry and system navigation in a safe, immersive environment. By using screenshots of system interfaces and adding interactive elements like text inputs, dropdown menus, and buttons, it enables learners to apply their knowledge and receive immediate feedback. This makes it ideal for workplace training, as it helps users develop the skills to effectively navigate and use software systems while providing a valuable opportunity for validation of their learning.

## Features

- **Interactive Hands-On Learning:** Allows learners to interact directly with system interfaces by simulating actions like entering text, selecting options, or clicking buttons.
- **Real-Time Feedback:** Provides immediate feedback on user actions, reinforcing learning through trial and error.
- **Customizable Actions:** Configurable elements such as clickable areas, dropdown menus, input fields, and date pickers help simulate real-life interactions with a system.
- **Risk-Free Practice:** Learners can make mistakes and learn from them without any real-world consequences, making the learning process safe and supportive.
- **Versatile Use Cases:** Suitable for training scenarios where learners need to practice specific system functionalities, from data entry to navigating complex workflows.

## Installation

To install the Adapt Simulation Component in the Adapt framework, run the following command from the command line:

```sh
adapt install adapt-esdc-simulation
```

To install the plugin to the Authoring Tool, follow these steps:

1. **Download the Plugin**: Obtain the plugin from the GitHub repository or another source.
2. **Upload to Authoring Tool**: Use the Adapt authoring tool\'s Plug-in Manager to upload and install the plugin.

## Settings Overview

Below are the attributes used in `components.json` to configure the Adapt Tour Component. These attributes are properly formatted as JSON in `example.json`.

### Global Settings

- **simulationWindow (string)**: The ARIA label for the simulation window. It provides context for screen reader users.  
- **simulationControls (string)**: The ARIA label for the control bar. It provides context for screen reader users.  
- **startSimulation (string)**: The text displayed on the button to start the simulation.  
- **restartSimulation (string)**: The text displayed on the button to restart the simulation.  
- **goBack (string)**: The label for the button to go back in the simulation.  
- **showInstructions (string)**: The label for the button to show instructions.  
- **exitSimulation (string)**: The label for the button to exit the simulation.  
- **fullScreen (string)**: The label for the button to toggle full screen mode.  
- **mobileMessage (string)**: The error message shown on mobile devices indicating that a larger screen is required.  
- **remainingCharacters (string)**: The label for remaining characters in a text input field, where `{{_characterCounterLimit}}` is dynamically replaced with the remaining count.  
- **incorrectFallback (string)**: The fallback message shown when the user enters incorrect input.  
- **issuesDetected (string)**: The label indicating issues detected with the form fields.  
- **youEntered (string)**: The label displaying the user’s input, with `{{userValue}}` dynamically replaced by the entered text.  
- **inputEmpty (string)**: The label shown when the user leaves a field empty.  
- **noOptionSelected (string)**: The label shown when no option is selected in a dropdown.  
- **actionNotCompleted (string)**: The label indicating that an action was not completed.  
- **completeFollowingTasks (string)**: The label prompting the user to complete the following tasks.


### Properties


### _items (array)

Each entry in the array represents an element in the guided tour and should contain the following properties:


----------------------------
Requires framework >=4.4.1
