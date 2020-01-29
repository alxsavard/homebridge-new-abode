let AbodeApi = require('./abodeApi');

let Service;
let Characteristic;

module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory("homebridge-abode", "Abode", AbodeAlarmAccessory);
};

function AbodeAlarmAccessory(log, config) {
	this.abode = new AbodeApi(config.abode.username, config.abode.password);
	this.log = log;
	this.name = config.name;

	this.abode.login().then((loginRes) => {
		this.abode.claims().then((claimsRes) => {
			this.lockService = new Service.SecuritySystem(this.name);

			this.lockService
				.getCharacteristic(Characteristic.SecuritySystemTargetState)
				.on('get', this.getAlarmStatus.bind(this))
				.on('set', this.setAlarmStatus.bind(this));

			this.lockService
				.getCharacteristic(Characteristic.SecuritySystemCurrentState)
				.on('get', this.getAlarmStatus.bind(this));
		}).catch((err) => {
			this.log(`${this.name}: ERROR GETTING CLAIMS ${err}`);
		});
	}).catch((err) => {
		this.log(`${this.name}: ERROR LOGIN IN ${err}`);
	});
}

AbodeAlarmAccessory.prototype.getAlarmStatus = function (callback) {
	this.log(`${this.name}: Getting Alarm Status`);

	this.abode.panel()
		.then(response => {
			if (response.data.mode.area_1) {
				let status = '';

				switch (response.data.mode.area_1) {
					case 'standby':
						status = Characteristic.SecuritySystemCurrentState.DISARMED;
						break;
					case 'home':
						status = Characteristic.SecuritySystemCurrentState.HOME_ARM;
						break;
					case 'away':
						status = Characteristic.SecuritySystemCurrentState.AWAY_ARM;
						break;
				}

				this.log(`${this.name}: Status is ${status}`);

				this.lockService.setCharacteristic(Characteristic.SecuritySystemCurrentState, status);
				return callback(null, status);
			}

			return callback(null);
		})
		.catch(err => {
			this.log(`${this.name}: ERROR GETTING STATUS ${err}`);
			return callback(null);
		});
};

function changeStatus(state) {
	let operation;

	switch (state) {
		case Characteristic.SecuritySystemTargetState.STAY_ARM:
			operation = this.abode.home();
			break;
		case Characteristic.SecuritySystemTargetState.AWAY_ARM :
			operation = this.abode.away();
			break;
		case Characteristic.SecuritySystemTargetState.NIGHT_ARM:
			operation = this.abode.home();
			break;
		case Characteristic.SecuritySystemTargetState.DISARM:
			operation = this.abode.standby();
			break;
	}

	return operation;
}

AbodeAlarmAccessory.prototype.setAlarmStatus = function (state, callback) {
	this.log(`${this.name}: Setting status status to ${state}`);

	return changeStatus(state)
		.then(() => {
			this.lockservice.setCharacteristic(Characteristic.SecuritySystemCurrentState, state);
			this.log(`${this.name}: Set status to ${state}`);
			return callback(null);
		})
		.catch(err => {
			if (err.response.status === 615) { // Force Status
				return changeStatus(state);
			}

			this.log(`${this.name}: ERROR SETTING STATUS ${err}`);
			return callback(null);
		});
};

AbodeAlarmAccessory.prototype.getServices = function () {
	this.log(`${this.name}: Getting Services`);
	return [this.lockService];
};

AbodeAlarmAccessory(console.log, { name: 'Abode', accessory: 'Abode', abode: { username: 'alx.savard@gmail.com', password: '*5iXF5e$tceEFF#0' } });
