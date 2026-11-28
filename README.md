# microbitWorld
Interactive virtual world for your micro:bit projects 


# Microbit Studio
[Launch the dashboard](https://aaron-ragsdale.github.io/microbitStudio/)

Program anything. Connect it. Visualize it. Control it.

## Getting started
Enable GitHub Pages from main / root in repository settings. Open the page in desktop Chrome or Edge. Try Demo, then add widgets from discovered variables. For USB use 115200 baud; for Bluetooth enable the micro:bit UART service.

## Extensions
Import one of these URLs in MakeCode Extensions:
- https://github.com/aaron-ragsdale/pxt-studio-connect (Bluetooth)
- https://github.com/aaron-ragsdale/pxt-studio-connect-usb (USB, compatible with radio)

## Protocol
Send newline-delimited name:value pairs or JSON objects. Incoming commands are newline-delimited strings. Use the extension's on Studio message block to handle commands. PING receives studio:PONG when the handler is registered. LED data is led: followed by 25 binary digits in row-major order.

## Initial prototype
Dashboard widgets, variable discovery, serial monitor, CSV recording, local widget persistence and demo. Hardware testing and extension compilation still required. Multiple devices, layout editing and additional widgets are planned.


## Universal firmware (micro:bit V2)
1. [Download the compiled Studio HEX](https://aaron-ragsdale.github.io/microbitStudio/firmware/microbit_Studio.hex) (requires the compiled file in `firmware/microbit_Studio.hex`).
2. Connect by USB and open the [official online HEX programmer](https://microbit.org/tools/webusb-hex-download-tool/).
3. Select the downloaded HEX and flash the board. Return to Studio and choose + Bluetooth.
