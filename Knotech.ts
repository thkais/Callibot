
let KInitialized = 0
let KLedState = 0

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

enum KRgbLed {
    //% block="Links vorne"
    LV,
    //% block="Rechts vorne"
    RV,
    //% block="Links hinten"
    LH,
    //% block="Rechts hinten"
    RH,
    //% block="Alle"
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


//% color="#ff0000" icon="\uf013"
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
        let buffer = pins.createBuffer(3);
        KInit();
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
        let buffer = pins.createBuffer(2);
        KInit();
        buffer[0] = 0;      // SubAddress of LEDs
        //buffer[1]  Bit 0/1 = state of LEDs
        switch (led) {
            case KSensor.links:
                if (state == KState.an) {
                    KLedState |= 0x01;
                }
                else {
                    KLedState &= 0xFE;
                }
                break;
            case KSensor.rechts:
                if (state == KState.an) {
                    KLedState |= 0x02;
                }
                else {
                    KLedState &= 0xFD;
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

        KInit();
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
                tColor = 0x02;
                break;
            case KRgbColor.grün:
                tColor = 0x01;
                break;
            case KRgbColor.blau:
                tColor = 0x04;
                break;
            case KRgbColor.gelb:
                tColor = 0x03;
                break;
            case KRgbColor.türkis:
                tColor = 0x05;
                break;
            case KRgbColor.violett:
                tColor = 0x06;
                break;
            case KRgbColor.weiß:
                tColor = 0x07;
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
        let buffer = pins.createBuffer(len);
        buffer[0] = index;
        buffer[1] = intensity | tColor;
        if (len == 5) {
            buffer[2] = buffer[1];
            buffer[3] = buffer[1];
            buffer[4] = buffer[1];
        }
        pins.i2cWriteBuffer(0x21, buffer);
    }

    //="Liniensensor $sensor"
    //% blockId K_readLineSensor block="Liniensensor |%sensor"
    export function readLineSensor(sensor: KSensor): boolean {
        let buffer = pins.i2cReadBuffer(0x21, 1);
        KInit();
        if (sensor == KSensor.links) {
            buffer[0] &= 0x02;
        }
        if (sensor == KSensor.rechts) {
            buffer[0] &= 0x01;
        }
        if (buffer[0] != 0) {
            return true;
        }
        else {
            return false;
        }
    }

    //% blockId=K_entfernung block="Entfernung (mm)" blockGap=8
    export function entfernung(): number {
        let buffer = pins.i2cReadBuffer(0x21, 3);
        KInit();
        return 256 * buffer[1] + buffer[2];
    }
}
