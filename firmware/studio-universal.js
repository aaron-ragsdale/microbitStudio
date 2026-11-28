// Microbit Studio universal firmware v5 (on-demand USB + Bluetooth) — paste into MakeCode JavaScript.
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
let eventA = false
let eventB = false
let eventShake = false
let shakeRegistered = false
let lastControl = 0
let countA = 0
let countB = 0
let countShake = 0
let outgoing: string[] = []
function emit(key: string, value: string) {
    let message = key + ":" + value + "\n"
    if (outgoing.length < 64) outgoing.push(message)
}
function emitCount(key: string, n: number) {
    emit(key, "" + n + "," + (n % 97))
}
basic.forever(function () {
    if (outgoing.length > 0) {
        let message = outgoing.shift()
        if (usbActive) serial.writeString(message)
        if (connected) bluetooth.uartWriteString(message)
    }
    basic.pause(1)
})

// VM: bounded straight-line numeric instructions, handlers 0=start, 1=A, 2=B, 3..6=virtual.
let vmCode: string[] = []
let vmVars: number[] = []
let vmDirty: number[] = []
let vmRunning = false
let vmExpected = 0
let vmLoaded = 0
let vmUpload = false
let vmError = false
let displayText = ""
let displayOffset = 0
let displayNext = 0
let digits = ["111101101101111","010110010010111","111001111100111","111001111001111","101101111001001","111100111001111","111100111101111","111001001001001","111101111101111","111101111001111"]
function fastNumber(n: number) {
    displayText = "" + Math.round(n)
    displayOffset = 0
    displayNext = 0
}
function displayFrame() {
    if (displayText.length == 0) return
    let width = displayText.length * 4 - 1
    for (let x = 0; x < 5; x++) {
        let col = x + displayOffset - (width <= 5 ? Math.idiv(width - 5, 2) : 0)
        for (let y = 0; y < 5; y++) {
            let on = false
            if (col >= 0 && col < width && col % 4 < 3) {
                let ch = displayText.charAt(Math.idiv(col, 4))
                if (ch == "-") on = y == 2
                else on = digits[parseInt(ch)].charAt(y * 3 + col % 4) == "1"
            }
            if (on) led.plot(x,y)
            else led.unplot(x,y)
        }
    }
    if (width > 5) {
        displayOffset += 1
        if (displayOffset > width - 5) displayOffset = 0
        displayNext = input.runningTime() + 180
    } else displayNext = input.runningTime() + 100000000
}
function vmOperand(a: string): number {
    if (a.charAt(0) == "v") return vmVars[parseInt(a.substr(1))]
    return parseInt(a)
}
function vmValidOperand(a: string): boolean {
    let n = parseInt(a.charAt(0) == "v" ? a.substr(1) : a)
    if (a.charAt(0) == "v") return n >= 0 && n < vmVars.length && a == "v" + n
    return n >= -999999 && n <= 999999 && a == "" + n
}
function vmExecute(h: number) {
    if (!vmRunning) return
    for (let i = 0; i < vmCode.length; i++) {
        let a = vmCode[i].split(",")
        if (parseInt(a[0]) == h) {
            let slot = parseInt(a[2])
            if (a[1] == "N") fastNumber(vmOperand(a[2]))
            else if (a[1] == "C") {
                displayText = ""
                basic.clearScreen()
            } else {
                let n = vmOperand(a[3])
                if (a[1] == "A") n += vmVars[slot]
                vmVars[slot] = Math.max(-999999, Math.min(999999,n))
                vmDirty[slot] = 1
            }
        }
    }
}
function vmCommand(a: string[]) {
    let op = a[0]
    let p = parseInt(a[1])
    if (op == "VB") {
        vmRunning = false
        vmCode = []
        vmVars = []
        vmDirty = []
        vmLoaded = 0
        vmExpected = parseInt(a[2])
        vmError = !(p >= 0 && p <= 16 && vmExpected >= 0 && vmExpected <= 64)
        vmUpload = !vmError
        if (vmUpload) for (let i = 0; i < p; i++) {
            vmVars.push(0)
            vmDirty.push(1)
        }
        emit("vm", vmUpload ? "B" : "E")
    } else if (op == "VI") {
        let h = parseInt(a[2])
        let k = a[3]
        let slot = parseInt(a[4])
        let valid = vmUpload && p == vmLoaded && vmLoaded < vmExpected && h >= 0 && h <= 6
        if (k == "S" || k == "A") valid = valid && a.length == 6 && slot >= 0 && slot < vmVars.length && vmValidOperand(a[5])
        else if (k == "N") valid = valid && a.length == 5 && vmValidOperand(a[4])
        else if (k == "C") valid = valid && a.length == 4
        else valid = false
        if (valid) {
            let row = a[2] + "," + k
            if (a.length > 4) row += "," + a[4]
            if (a.length > 5) row += "," + a[5]
            vmCode.push(row)
            vmLoaded += 1
            emit("vm", "" + p)
        } else {
            vmError = true
            emit("vm", "E")
        }
    } else if (op == "VR") {
        if (vmUpload && !vmError && vmLoaded == vmExpected) {
            vmUpload = false
            vmRunning = true
            vmExecute(0)
            emit("vm", "R")
        } else emit("vm", "E")
    } else if (op == "VH" && p >= 3 && p <= 6) {
        vmExecute(p)
    } else if (op == "VQ") {
        if (vmRunning) for (let i = 0; i < vmVars.length; i++) vmDirty[i] = 1
    }
}
basic.forever(function () {
    if (displayText.length > 0 && input.runningTime() >= displayNext) displayFrame()
    if (vmRunning && outgoing.length < 8) {
        for (let i = 0; i < vmVars.length; i++) {
            if (vmDirty[i] == 1) {
                vmDirty[i] = 0
                emit("vv" + i, "" + vmVars[i])
                break
            }
        }
    }
    basic.pause(5)
})

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
    vmRunning = false
    vmUpload = false
    displayText = ""
    eventA = false
    eventB = false
    eventShake = false
    watched = -1
    gateA = -1
    gateB = -1
    gateStart = -1
}
bluetooth.onBluetoothConnected(function () {
    connected = true
    emit("firmware", "studio-v5")
    matrix()
})
bluetooth.onBluetoothDisconnected(function () {
    connected = false
    stopAll()
})
input.onButtonPressed(Button.A, function () {
    if (vmRunning) vmExecute(1)
    if (eventA) {
        countA += 1
        emitCount("ea", countA)
    }
})
input.onButtonPressed(Button.B, function () {
    if (vmRunning) vmExecute(2)
    if (eventB) {
        countB += 1
        emitCount("eb", countB)
    }
})

function readSensor(key: string) {
    if (key == "ax") emit(key, "" + input.acceleration(Dimension.X))
    else if (key == "ay") emit(key, "" + input.acceleration(Dimension.Y))
    else if (key == "az") emit(key, "" + input.acceleration(Dimension.Z))
    else if (key == "strength") emit(key, "" + input.acceleration(Dimension.Strength))
    else if (key == "temperature") emit(key, "" + input.temperature())
    else if (key == "light") emit(key, "" + input.lightLevel())
    else if (key == "sound") emit(key, "" + input.soundLevel())
    else if (key == "aPressed") emit(key, input.buttonIsPressed(Button.A) ? "1" : "0")
    else if (key == "bPressed") emit(key, input.buttonIsPressed(Button.B) ? "1" : "0")
    else emit("error", "unknown sensor")
}
function handleCommand(line: string) {
    lastControl = input.runningTime()
    line = line.trim()
    if (line == "KEEP") return
    if (line == "COUNTS") {
        if (eventA) emitCount("ea", countA)
        if (eventB) emitCount("eb", countB)
        if (eventShake) emitCount("es", countShake)
        return
    }
    if (line == "PING") {
        emit("studio", "PONG")
        return
    }
    if (line == "HELLO") {
        stopAll()
        emit("firmware", "studio-v5")
        return
    }
    if (line == "STOP_ALL") {
        stopAll()
        return
    }
    if (line.substr(0, 4) == "LED:") {
        displayText = ""
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
    if (op == "VB" || op == "VI" || op == "VR" || op == "VH" || op == "VQ") {
        vmCommand(a)
    } else if (op == "READ") {
        readSensor(a[1])
    } else if (op == "EVENT") {
        if (a[1] == "buttonA") {
            if (!eventA && v == 1) countA = 0
            eventA = v == 1
        } else if (a[1] == "buttonB") {
            if (!eventB && v == 1) countB = 0
            eventB = v == 1
        }
        else if (a[1] == "shake") {
            if (!eventShake && v == 1) countShake = 0
            eventShake = v == 1
            if (eventShake && !shakeRegistered) {
                shakeRegistered = true
                input.onGesture(Gesture.Shake, function () {
                    if (eventShake) {
                        countShake += 1
                        emitCount("es", countShake)
                    }
                })
            }
        }
        emit("event_" + a[1], "" + v)
    } else if (op == "CLEAR") {
        displayText = ""
        basic.clearScreen()
        matrix()
    } else if (op == "NUMBER") {
        if (p >= -999999 && p <= 999999) fastNumber(p)
    } else if (op == "PLOT" && p >= 0 && p < 5 && v >= 0 && v < 5) {
        displayText = ""
        led.plot(p, v)
        matrix()
    } else if (op == "UNPLOT" && p >= 0 && p < 5 && v >= 0 && v < 5) {
        displayText = ""
        led.unplot(p, v)
        matrix()
    } else if (op == "RATE") {
        // Retained for older clients; v4 does not stream periodically.
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
    if (!vmRunning && input.runningTime() - lastControl > 10000) stopAll()
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
