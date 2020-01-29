const axios = require('axios');

module.exports = class AbodeApi {
  api = axios.create({
    baseURL: 'https://my.goabode.com/api'
  });

  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  async home() {
    await this.claims();

    return await this.api.put(
      `/v1/panel/mode/1/home`,
      {
        area: "1",
        mode: "home"
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
          'ABODE-API-KEY': this.apiKey
        }
      });
  }

  async standby() {
    await this.claims();

    return await this.api.put(
      `/v1/panel/mode/1/standby`,
      {
        area: "1",
        mode: "standby"
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
          'ABODE-API-KEY': this.apiKey
        }
      });
  }

  async away() {
    await this.claims();

    return this.api.put(
      `/v1/panel/mode/1/away`,
      {
        area: "1",
        mode: "away"
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
          'ABODE-API-KEY': this.apiKey
        }
      });
  }

  async claims() {
    const response = await this.api.get(
      `/auth2/claims`,
      {
        headers: {
          'Content-Type': 'application/json',
          'ABODE-API-KEY': this.apiKey
        }
      });

    if (response.status === 200) {
      this.token = response.data.access_token;
      return response;
    }

    throw response;
  }

  async login() {
    const response = await this.api.post(
      `/auth2/login`,
      {
        id: this.username,
        password: this.password,
        uuid: this.uuid()
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      });

    if (response.status === 200) {
      this.apiKey = response.data.token;
      return response;
    }

    throw response;
  }

  async panel() {
    return await this.api.get(
      `/v1/panel`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
          'ABODE-API-KEY': this.apiKey
        }
      });
  }

  uuid() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      // eslint-disable-next-line
      let r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }
};
