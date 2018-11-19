# OnChange InputBox/TextArea [![Support](https://img.shields.io/badge/Mendix%20Support%3A-Community-orange.svg)](https://docs.mendix.com/community/app-store/app-store-content-support)

This widget creates an inputbox or textarea that lets you run a microflow or nanoflow every time a user changes the content, one key press at a time. It features a delay and a minimum character threshold to prevent excessive microflow or nanoflow calls.

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!

### Properties

#### OnchnageInputbox

**Attribute:** The attribute that is linked to the inputbox.

**On change microflow:** The microflow that is triggered when text in the inputbox is changed.

**On change nanoflow:** The nanoflow that is triggered when text in the inputbox is changed.

**On leave microflow:** The microflow that is triggered when the inputbox loses focus.

**On leave nanoflow:** The nanoflow that is triggered when the inputbox loses focus.

**Delay:** _[Optional]_ The delay in milliseconds before the on change microflow or nanoflow is triggered.

**Character Threshold:** _[Optional]_ The minimum amount of characters required for the on change microflow or nanoflow to be triggered.

#### OnchangeTextarea

**Attribute:** The attribute that is linked to the inputbox.

**On change microflow:** The microflow that is triggered whenever text in the textarea is changed.

**On change nanoflow:** The nanoflow that is triggered whenever text in the textarea is changed.

**Delay:** _[Optional]_ The delay in milliseconds before the on change microflow or nanoflow is triggered.

**Character Threshold:** _[Optional]_ The minimum amount of characters required for the on change microflow to be triggered.

**The attributes under _General_ are exactly the same as those for a normal TextArea.**
