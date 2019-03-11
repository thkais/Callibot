
let KInitialized = 0
let KLedState = 0
//let KFunkInitialized = 0

enum KMotor {
    links,
    rechts,
    beide
}

enum KStop {
    //% block="auslaufend"
    Frei,
    //% block="bremsend"
    Bremsen
}

enum KSensor {
    links,
    rechts
}

enum KSensorStatus {
    hell,
    dunkel
}

enum KRgbLed {
    //% block="links vorne"
    LV,
    //% block="rechts vorne"
    RV,
    //% block="links hinten"
    LH,
    //% block="rechts hinten"
    RH,
    //% block="alle"
    All
}

enum KRgbColor {
    rot,
    grün,
    blau,
    gelb,
    violett,
    türkis,
    weiß
}

enum KDir {
    vorwärts = 0,
    rückwärts = 1
}

enum KState {
    aus,
    an
}

enum KSensorWait {
    //% block="Entfernung"
    distance,
    //% block="Helligkeit"
    brightness,
    //% block="Temperatur"
    temperature,
    //% block="Kompass"
    compass,
    //% block="Magnetkraft"
    magnet,
    //% block="Rotation"
    rotation,
    //% block="Rollen"
    roll,
    //% block="Beschleunigung X"
    accellX,
    //% block="Beschleunigung Y"
    accellY,
    //% block="Beschleunigung Z"
    accellZ,
    //% block="Beschleunigung Stärke"
    accellStrength
}

enum KCheck {
    //% block="="
    equal,
    //% block="<"
    lessThan,
    //% block=">"
    greaterThan
}

//% color="#FF0000" icon="\uf013" block="Calli:bot"
namespace Callibot {

    function KInit() {
        if (KInitialized != 1) {
            KInitialized = 1;
            setLed(KSensor.links, KState.aus);
            setLed(KSensor.rechts, KState.aus);
            motorStop(KMotor.beide, KStop.Bremsen);
            setRgbLed(KRgbLed.All, KRgbColor.rot, 0);
        }
    }

    function writeMotor(nr: KMotor, direction: KDir, speed: number) {
        let buffer = pins.createBuffer(3)
        KInit()
        basic.pause(10)
        buffer[1] = direction;
        buffer[2] = speed;
        switch (nr) {
            case KMotor.links:
                buffer[0] = 0x00;
                pins.i2cWriteBuffer(0x20, buffer);
                break;
            case KMotor.beide:
                buffer[0] = 0x00;
                pins.i2cWriteBuffer(0x20, buffer);
            case KMotor.rechts:
                buffer[0] = 0x02;
                pins.i2cWriteBuffer(0x20, buffer);
                break;
        }
    }

    //% speed.min=5 speed.max=100
    //% blockId=K_motor block="Schalte Motor |%KMotor| |%KDir| mit |%number| %"
    export function motor(nr: KMotor, direction: KDir, speed: number) {
        if (speed > 100) {
            speed = 100
        }
        if (speed < 0) {
            speed = 0
        }
        speed = speed * 255 / 100
        writeMotor(nr, direction, speed);
    }

    //="Stoppe Motor $nr"
    //% blockId=K_motorStop block="Stoppe Motor |%nr| |%mode"
    export function motorStop(nr: KMotor, mode: KStop) {
        if (mode == KStop.Frei) {
            writeMotor(nr, 0, 1);
        }
        else {
            writeMotor(nr, 0, 0);
        }
    }

    //% blockId=K_SetLed block="Schalte LED |%KSensor| |%KState"
    export function setLed(led: KSensor, state: KState) {
        let buffer = pins.createBuffer(2)
        KInit()
        basic.pause(10)
        buffer[0] = 0;      // SubAddress of LEDs
        //buffer[1]  Bit 0/1 = state of LEDs
        switch (led) {
            case KSensor.links:
                if (state == KState.an) {
                    KLedState |= 0x01
                }
                else {
                    KLedState &= 0xFE
                }
                break;
            case KSensor.rechts:
                if (state == KState.an) {
                    KLedState |= 0x02
                }
                else {
                    KLedState &= 0xFD
                }

                break;
        }
        buffer[1] = KLedState;
        pins.i2cWriteBuffer(0x21, buffer);
    }

    //% intensity.min=0 intensity.max=8
    //% blockId=K_RGB_LED block="Schalte Beleuchtung |%led| Farbe|%color| Helligkeit|%intensity|"
    export function setRgbLed(led: KRgbLed, color: KRgbColor, intensity: number) {
        let tColor = 0;
        let index = 0;
        let len = 0;

        KInit()
        basic.pause(10)
        if (intensity < 0) {
            intensity = 0;
        }
        if (intensity > 8) {
            intensity = 8;
        }
        if (intensity > 0) {
            intensity = (intensity * 2 - 1) * 16;
        }

        switch (color) {
            case KRgbColor.rot:
                tColor = 0x02
                break;
            case KRgbColor.grün:
                tColor = 0x01
                break;
            case KRgbColor.blau:
                tColor = 0x04
                break;
            case KRgbColor.gelb:
                tColor = 0x03
                break;
            case KRgbColor.türkis:
                tColor = 0x05
                break;
            case KRgbColor.violett:
                tColor = 0x06
                break;
            case KRgbColor.weiß:
                tColor = 0x07
                break;
        }
        switch (led) {
            case KRgbLed.LH:
                index = 2;
                len = 2;
                break;
            case KRgbLed.RH:
                index = 3;
                len = 2;
                break;
            case KRgbLed.LV:
                index = 1;
                len = 2;
                break;
            case KRgbLed.RV:
                index = 4;
                len = 2;
                break;
            case KRgbLed.All:
                index = 1;
                len = 5;
                break;
        }
        let buffer = pins.createBuffer(len)
        buffer[0] = index;
        buffer[1] = intensity | tColor
        if (len == 5) {
            buffer[2] = buffer[1];
            buffer[3] = buffer[1];
            buffer[4] = buffer[1];
        }
        pins.i2cWriteBuffer(0x21, buffer)
    }

    //="Liniensensor $sensor"
    //% blockId K_readLineSensor block="Liniensensor |%sensor| |%status"
    export function readLineSensor(sensor: KSensor, status: KSensorStatus): boolean {
        let result = false

        basic.pause(10)
        let buffer = pins.i2cReadBuffer(0x21, 1);
        KInit();
        if (sensor == KSensor.links) {
            buffer[0] &= 0x02
        }
        if (sensor == KSensor.rechts) {
            buffer[0] &= 0x01
        }
        switch (status) {
            case KSensorStatus.hell:
                if (buffer[0] != 0) {
                    result = true
                }
                else {
                    result = false
                }
                break
            case KSensorStatus.dunkel:
                if (buffer[0] == 0) {
                    result = true
                }
                else {
                    result = false
                }
                break
        }
        return result
    }

    //% blockId=K_entfernung block="Entfernung (mm)" blockGap=8
    export function entfernung(): number {
        let buffer = pins.i2cReadBuffer(0x21, 3)
        KInit()
        basic.pause(10)
        return 256 * buffer[1] + buffer[2]
    }

    //% blockId=K_warte color="#00A4A6" block="Warte bis |%sensor| |%check| |%value"
    export function warte(sensor: KSensorWait, check: KCheck, value: number) {
        let abbruch = 0
        let sensorValue = 0
        while (abbruch == 0) {
            switch (sensor) {
                case KSensorWait.distance:
                    sensorValue = entfernung()
                    break;
                case KSensorWait.accellStrength:
                    sensorValue = input.acceleration(Dimension.Strength)
                    break;
                case KSensorWait.accellX:
                    sensorValue = input.acceleration(Dimension.X)
                    break;
                case KSensorWait.accellY:
                    sensorValue = input.acceleration(Dimension.Y)
                    break;
                case KSensorWait.accellZ:
                    sensorValue = input.acceleration(Dimension.Z)
                    break;
                case KSensorWait.brightness:
                    sensorValue = input.lightLevel()
                    break;
                case KSensorWait.compass:
                    sensorValue = input.compassHeading()
                    break;
                case KSensorWait.magnet:
                    sensorValue = input.magneticForce(Dimension.Strength)
                    break;
                case KSensorWait.roll:
                    sensorValue = input.rotation(Rotation.Roll)
                    break;
                case KSensorWait.rotation:
                    sensorValue = input.rotation(Rotation.Pitch)
                    break;
                case KSensorWait.temperature:
                    sensorValue = input.temperature()
                    break;
            }
            switch (check) {
                case KCheck.equal:
                    if (sensorValue == value)
                        abbruch = 1
                    break;
                case KCheck.lessThan:
                    if (sensorValue < value)
                        abbruch = 1
                    break;
                case KCheck.greaterThan:
                    if (sensorValue > value)
                        abbruch = 1
                    break;
            }
        }
    }

    //% blockId=K_warte_LSensor color="#00A4A6" block="Warte bis Liniensensor |%sensor| = |%status"
    export function warteLSensor(sensor: KSensor, status: KSensorStatus) {

        while (!(readLineSensor(sensor, status))) {
        }
    }

    //% blockID=K_Fernsteuerung_Empfaenger color="#E3008C" block="Fernsteuerung Empfänger Gruppe |%gruppe"
    export function empfaenger(gruppe: number) {
        let Zeit = 0
        let MotorRechts = 0
        let MotorLinks = 0
        radio.onDataPacketReceived(({ receivedString: name, receivedNumber: wert }) => {
            if (name == "L") {
                MotorLinks = wert
            }
            if (name == "R") {
                MotorRechts = wert
            }
            Zeit = 50
        })
        radio.setTransmitPower(7)
        radio.setGroup(0)
        while (1 == 1) {
            if (MotorLinks < 0) {
                Callibot.motor(KMotor.rechts, KDir.vorwärts, Math.abs(MotorLinks))
            } else {
                Callibot.motor(KMotor.rechts, KDir.rückwärts, MotorLinks)
            }
            if (MotorRechts < 0) {
                Callibot.motor(KMotor.links, KDir.vorwärts, Math.abs(MotorRechts))
            } else {
                Callibot.motor(KMotor.links, KDir.rückwärts, MotorRechts)
            }
            basic.pause(1)
            if (Zeit > 0) {
                Zeit += -1
            } else {
                MotorLinks = 0
                MotorRechts = 0
            }
        }
    }

    //% blockID=K_Fernsteuerung_Sender color="#E3008C" block="Fernsteuerung Sender Gruppe |%gruppe| Übertragungsstärke |%staerke"
    export function sender(gruppe: number, staerke: number) {
        let MotorRechts = 0
        let MotorLinks = 0
        let WertY = 0
        let AccelY = 0
        let WertX = 0
        let AccelX = 0

        radio.setTransmitPower(staerke)
        radio.setGroup(gruppe)

        while (1 == 1) {
            AccelX = input.acceleration(Dimension.X)
            if (AccelX > 100) {
                WertX = (AccelX - 100) / 5
            } else if (AccelX < -100) {
                WertX = (AccelX + 100) / 5
            } else {
                WertX = 0
            }
            AccelY = input.acceleration(Dimension.Y)
            if (AccelY > 100) {
                WertY = (AccelY - 100) / 5
            } else if (AccelY < -100) {
                WertY = (AccelY + 100) / 5
            } else {
                WertY = 0
            }
            MotorLinks = WertY + WertX
            MotorRechts = WertY - WertX
            radio.sendValue("L", MotorLinks)
            radio.sendValue("R", MotorRechts)
        }
    }


}
