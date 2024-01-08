export function capacitance(value: number): string {
	/* if (value <= 0.00001) {
		return value * 1000000 + 'u'; //Micro/u
	} else if (value <= 5e-7) {
		return value * 10000000 + 'n'; //Nano/u
	} else if (value < 1e-10) {
		return value * 100000000 + 'p'; //Pico/p
	} else {
		return value + 'F';
	} */
	if (value >= 0.001) {
		return value + 'F';
	} else if (value > 1e-10) {
		return value * 1000000000000 + 'pF'; //Pico/p
	} else if (value > 5e-7) {
		return value * 1000000000 + 'nF'; //Nano/u
	} else {
		return value * 1000000 + 'uF'; //Micro/u
	}
}
