// Microbit Studio universal firmware v2 (USB + Bluetooth) — paste into MakeCode JavaScript.
// Add the official Bluetooth extension first. Target: micro:bit V2.
// Protocol: newline-delimited commands and name:value responses.
bluetooth.startUartService()
serial.redirectToUSB()
serial.setBaudRate(BaudRate.BaudRate115200)
let usbActive = false
let connected = false
let watched = -1
let previous = -1
let gateA = -1
let gateB = -1
let gateStart = -1
let prevA = 1
let prevB = 1
let lastSample = 0
let sampleInterval = 200
function emit(key: string, value: string) {
    let message = key + ":" + value + "\n"
    if (usbActive) serial.writeString(message)
    if (connected) bluetooth.uartWriteString(message)
}
function validPin(p: number): boolean {
    return p == 0 || p == 1 || p == 2 || p == 8 || p == 12 || p == 13 || p == 14 || p == 15 || p == 16
}
function analogPin(p: number): boolean {
    return p == 0 || p == 1 || p == 2
}
function digitalPin(p: number): DigitalPin {
    switch (p) {
        case 0: return DigitalPin.P0
        case 1: return DigitalPin.P1
        case 2: return DigitalPin.P2
        case 8: return DigitalPin.P8
        case 12: return DigitalPin.P12
        case 13: return DigitalPin.P13
        case 14: return DigitalPin.P14
        case 15: return DigitalPin.P15
        default: return DigitalPin.P16
    }
}
function analogPort(p: number): AnalogPin {
    switch (p) {
        case 0: return AnalogPin.P0
        case 1: return AnalogPin.P1
        default: return AnalogPin.P2
    }
}
function matrix() {
    let s = ""
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            s += led.point(x, y) ? "1" : "0"
        }
    }
    emit("led", s)
}
function stopAll() {
    watched = -1
    gateA = -1
    gateB = -1
    gateStart = -1
}
bluetooth.onBluetoothConnected(function () {
    connected = true
    emit("firmware", "studio-v2")
    matrix()
})
bluetooth.onBluetoothDisconnected(function () {
    connected = false
    stopAll()
})
input.onButtonPressed(Button.A, function () {
    emit("buttonA", "1")
})
input.onButtonPressed(Button.B, function () {
    emit("buttonB", "1")
})
input.onGesture(Gesture.Shake, function () {
    emit("shake", "1")
})
function handleCommand(line: string) {
    line = line.trim()
    if (line == "PING") {
        emit("studio", "PONG")
        return
    }
    if (line == "HELLO") {
        emit("firmware", "studio-v2")
        return
    }
    if (line == "STOP_ALL") {
        stopAll()
        return
    }
    if (line.substr(0, 4) == "LED:") {
        let pattern = line.substr(4)
        if (pattern.length != 25) return
        for (let i = 0; i < 25; i++) {
            if (pattern.charAt(i) == "1") led.plot(i % 5, Math.idiv(i, 5))
            else led.unplot(i % 5, Math.idiv(i, 5))
        }
        matrix()
        return
    }
    let a = line.split(",")
    let op = a[0]
    let p = parseInt(a[1])
    let v = parseInt(a[2])
    if (op == "CLEAR") {
        basic.clearScreen()
        matrix()
    } else if (op == "NUMBER") {
        basic.showNumber(p)
        matrix()
    } else if (op == "PLOT" && p >= 0 && p < 5 && v >= 0 && v < 5) {
        led.plot(p, v)
        matrix()
    } else if (op == "UNPLOT" && p >= 0 && p < 5 && v >= 0 && v < 5) {
        led.unplot(p, v)
        matrix()
    } else if (op == "RATE" && p >= 100 && p <= 5000) {
        sampleInterval = p
    } else if (op == "DREAD" && validPin(p)) {
        emit("digital" + p, "" + pins.digitalReadPin(digitalPin(p)))
    } else if (op == "DWRITE" && validPin(p) && (v == 0 || v == 1)) {
        pins.digitalWritePin(digitalPin(p), v)
    } else if (op == "AREAD" && analogPin(p)) {
        emit("analog" + p, "" + pins.analogReadPin(analogPort(p)))
    } else if (op == "PWM" && analogPin(p) && v >= 0 && v <= 1023) {
        pins.analogWritePin(analogPort(p), v)
    } else if (op == "SERVO" && analogPin(p) && v >= 0 && v <= 180) {
        pins.servoWritePin(analogPort(p), v)
    } else if (op == "PULL" && validPin(p)) {
        if (v == 1) pins.setPull(digitalPin(p), PinPullMode.PullUp)
        else if (v == 2) pins.setPull(digitalPin(p), PinPullMode.PullDown)
        else pins.setPull(digitalPin(p), PinPullMode.PullNone)
    } else if (op == "WATCH" && validPin(p)) {
        watched = p
        previous = pins.digitalReadPin(digitalPin(p))
    } else if (op == "ULTRA" && validPin(p) && validPin(v) && p != v) {
        pins.digitalWritePin(digitalPin(p), 0)
        control.waitMicros(2)
        pins.digitalWritePin(digitalPin(p), 1)
        control.waitMicros(10)
        pins.digitalWritePin(digitalPin(p), 0)
        let us = pins.pulseIn(digitalPin(v), PulseValue.High, 25000)
        emit("distance" + p + "_" + v, "" + (us == 0 ? -1 : us / 58))
    } else if (op == "GATE" && validPin(p) && validPin(v) && p != v) {
        gateA = p
        gateB = v
        prevA = pins.digitalReadPin(digitalPin(p))
        prevB = pins.digitalReadPin(digitalPin(v))
        gateStart = -1
    } else {
        emit("error", "invalid command")
    }
}
bluetooth.onUartDataReceived("\n", function () {
    handleCommand(bluetooth.uartReadUntil("\n"))
})
serial.onDataReceived("\n", function () {
    usbActive = true
    handleCommand(serial.readUntil("\n"))
})
basic.forever(function () {
    if ((connected || usbActive) && input.runningTime() - lastSample >= sampleInterval) {
        lastSample = input.runningTime()
        emit("ax", "" + input.acceleration(Dimension.X))
        emit("ay", "" + input.acceleration(Dimension.Y))
        emit("az", "" + input.acceleration(Dimension.Z))
        emit("strength", "" + input.acceleration(Dimension.Strength))
        emit("temperature", "" + input.temperature())
        emit("light", "" + input.lightLevel())
        emit("sound", "" + input.soundLevel())
        emit("aPressed", input.buttonIsPressed(Button.A) ? "1" : "0")
        emit("bPressed", input.buttonIsPressed(Button.B) ? "1" : "0")
    }
    basic.pause(20)
})
basic.forever(function () {
    if ((connected || usbActive) && watched >= 0) {
        let current = pins.digitalReadPin(digitalPin(watched))
        if (current != previous) {
            previous = current
            emit("digital" + watched, "" + current)
        }
    }
    if ((connected || usbActive) && gateA >= 0 && gateB >= 0) {
        let a = pins.digitalReadPin(digitalPin(gateA))
        let b = pins.digitalReadPin(digitalPin(gateB))
        let now = input.runningTime()
        if (prevA == 1 && a == 0) gateStart = now
        if (prevB == 1 && b == 0 && gateStart >= 0) {
            emit("gate_ms", "" + (now - gateStart))
            gateStart = -1
        }
        prevA = a
        prevB = b
    }
    basic.pause(5)
})
