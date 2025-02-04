import React, { Component } from 'react';
import i18next from 'i18next';

import apiManager from '../lib/APIManager';
import messageDispatcher from '../lib/MessageDispatcher';

class Register extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      config: props.config,
      registerConfig: props.registerConfig,
      registerProfile: props.registerProfile,
      registerSchemes: props.registerSchemes,
      token: props.token,
      registerValid: props.registerValid,
      registerDefaultLang: props.registerDefaultLang,
      
      username: "",
      email: "",
      code: "",
      password: "",
      passwordConfirm: "",
      
      usernameValid: false,
      usernameInvalid: false,
      verificationSent: false,
      invalidCode: false,
      showCode: false,
      timeout: false,
      checkingUsername: false,
      checkingEmail: false,
      invalidMessage: false,
      validMessage: false,
      invalidEmailMessage: true,
      invalidPassword: false,
      registerComplete: false,
      modifyPassword: false,
      suggestionCounter: 0,
      suggestionUsername: ""
    };
    
    this.confirmCancelRegistration = this.confirmCancelRegistration.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.selectSuggestion = this.selectSuggestion.bind(this);
    
    document.title = i18next.t("profile.register-title");
  }
  
  componentWillReceiveProps(nextProps) {
    this.setState({
      config: nextProps.config,
      registerConfig: nextProps.registerConfig,
      registerProfile: nextProps.registerProfile,
      token: nextProps.token,
      registerValid: nextProps.registerValid,
      registerDefaultLang: nextProps.registerDefaultLang
    });
  }
  
  checkUsername() {
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
    }
    if (this.state.username) {
      apiManager.glewlwydRequest("/" + this.state.config.params.register + "/username", "POST", {username: this.state.username})
      .then(() => {
        this.setState({timeout: false, usernameValid: true, usernameInvalid: false, checkingUsername: false, invalidMessage: false, validMessage: true, suggestionCounter: 0, suggestionUsername: ""});
      })
      .fail((err) => {
        if (err.status !== 400) {
          messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("error-api-connect")});
        } else {
          this.setState({timeout: false, usernameValid: false, usernameInvalid: true, checkingUsername: false, invalidMessage: true, validMessage: false, suggestionCounter: 0, suggestionUsername: ""});
          this.getUsernameSuggestion();
        }
      });
    } else {
      this.setState({timeout: false, usernameValid: false, usernameInvalid: false, checkingUsername: false, invalidMessage: false, validMessage: false, suggestionCounter: 0, suggestionUsername: ""});
    }
  }
  
  getUsernameSuggestion() {
    if (this.state.suggestionCounter < 10) {
      var suggestionUsername = this.state.username + Math.floor(Math.random() * 100);
      apiManager.glewlwydRequest("/" + this.state.config.params.register + "/username", "POST", {username: suggestionUsername})
      .then(() => {
        this.setState({suggestionCounter: this.state.suggestionCounter+1, suggestionUsername: suggestionUsername});
      })
      .fail((err) => {
        if (err.status !== 400) {
          messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("error-api-connect")});
        } else {
          this.getUsernameSuggestion();
        }
      });
    }
  }
  
  selectSuggestion(e) {
    e.preventDefault();
    this.setState({username: this.state.suggestionUsername, usernameValid: false, suggestionUsername: "", suggestionCounter: 0}, () => {
      this.checkUsername();
    });
  }
  
  checkEmailAsUsername() {
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
    }
    if (this.state.email) {
      apiManager.glewlwydRequest("/" + this.state.config.params.register + "/username", "POST", {username: this.state.email})
      .then(() => {
        this.setState({timeout: false, usernameValid: true, usernameInvalid: false, checkingEmail: false, invalidMessage: false, validMessage: true});
      })
      .fail((err) => {
        if (err.status !== 400) {
          messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("error-api-connect")});
          this.setState({timeout: false, usernameValid: false, usernameInvalid: true, checkingEmail: false, invalidMessage: true, validMessage: false});
        } else {
          this.setState({timeout: false, usernameValid: false, usernameInvalid: true, checkingEmail: false, invalidMessage: false, validMessage: false});
        }
      });
    } else {
      this.setState({timeout: false, usernameValid: false, usernameInvalid: false, checkingEmail: false, invalidMessage: false, validMessage: false});
    }
  }
  
  changeUsername(e) {
    e.preventDefault();
    this.setState({username: e.target.value, usernameValid: false}, () => {
      if (this.state.timeout) {
        clearTimeout(this.state.timeout);
      }
      this.setState({
        checkingUsername: true,
        timeout: setTimeout(() => {
          this.checkUsername();
        }, 1000)
      });
    });
  }
  
  changeEmailVerification(e) {
    var usernameValid = this.state.usernameValid;
    if (this.state.registerConfig["email-is-username"]) {
      usernameValid = true;
    }
    this.setState({email: e.target.value, invalidEmailMessage: !e.target.value, usernameValid: usernameValid});
  }
  
  changeEmailAsUsername(e) {
    this.setState({email: e.target.value, invalidEmailMessage: !e.target.value, usernameValid: true}, () => {
      if (this.state.timeout) {
        clearTimeout(this.state.timeout);
      }
      this.setState({
        checkingEmail: true,
        timeout: setTimeout(() => {
          this.checkEmailAsUsername();
        }, 1000)
      });
    });
  }
  
  changeCode(e) {
    this.setState({code: e.target.value, invalidCode: !e.target.value});
  }
  
  changeName(e) {
    e.preventDefault();
    var profile = this.state.registerProfile;
    profile.name = e.target.value;
    this.setState({registerProfile: profile});
  }
  
  changePassword(e) {
    this.setState({password: e.target.value}, () => {
      this.checkPassword();
    });
  }
  
  changeConfirmPassword(e) {
    this.setState({passwordConfirm: e.target.value}, () => {
      this.checkPassword();
    });
  }
  
  checkPassword() {
    var invalidPassword = false;
    if (this.state.password !== "" || this.state.passwordConfirm !== "") {
      if (this.state.password !== this.state.passwordConfirm) {
        invalidPassword = i18next.t("profile.register-password-error-not-match");
      } else if (this.state.password.length < (this.state.config.PasswordMinLength||8)) {
        invalidPassword = i18next.t("profile.register-password-ph", {car: (this.state.config.PasswordMinLength||8)});
      }
    }
    this.setState({invalidPassword: invalidPassword});
  }
  
  registerUsername() {
    apiManager.glewlwydRequest("/" + this.state.config.params.register + "/register", "POST", {username: this.state.username})
    .then(() => {
      messageDispatcher.sendMessage('App', {type: "registration"});
    })
    .fail((err) => {
      if (err.status !== 400) {
        messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("error-api-connect")});
      }
    });
  }
  
  noSubmit(e) {
    e.preventDefault();
    return false;
  }
  
  saveNameOrPassword(e) {
    e.preventDefault();
    
    let promiseName = apiManager.glewlwydRequest("/" + this.state.config.params.register + "/profile", "PUT", this.state.registerProfile)
    .fail((err) => {
      if (err.status !== 400) {
        messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("error-api-connect")});
      }
    });
    let promises = [promiseName];
    if (!this.state.invalidPassword && this.state.password.length >= (this.state.config.PasswordMinLength||8)) {
      let promisePwd = apiManager.glewlwydRequest("/" + this.state.config.params.register + "/profile/password", "POST", {password: this.state.password})
      .fail((err) => {
        if (err.status !== 400) {
          messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("error-api-connect")});
        }
      })
      .always(() => {
        this.setState({password: "", passwordConfirm: "", modifyPassword: false});
      });
      
      promises.push(promisePwd);
    }
    Promise.all(promises)
    .then(() => {
      messageDispatcher.sendMessage('App', {type: "registration"});
      messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("profile.register-profile-saved")});
    });
  }
  
  sendVerificationEmail() {
    var callback_url;
    if (this.state.config.params.callback_url) {
      callback_url = encodeURIComponent(this.state.config.params.callback_url);
    } else {
      callback_url = false;
    }
    apiManager.glewlwydRequest("/" + this.state.config.params.register + "/verify", "PUT", {username: this.state.username, email: this.state.email, lang: this.state.registerDefaultLang, callback_url: callback_url})
    .then(() => {
      messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("profile.register-profile-email-sent", {email: this.state.email})});
      this.setState({verificationSent: true});
    })
    .fail((err) => {
      if (err.status !== 400) {
        messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("error-api-connect")});
      } else {
        messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("profile.register-profile-email-invalid")});
      }
    });
  }
  
  verifyCode() {
    apiManager.glewlwydRequest("/" + this.state.config.params.register + "/verify", "POST", {username: this.state.username, email: this.state.email, code: this.state.code})
    .then(() => {
      messageDispatcher.sendMessage('App', {type: "registration"});
      messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("profile.register-profile-created")});
    })
    .fail((err) => {
      this.setState({invalidCode: true}, () => {
        if (err.status !== 400) {
          messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("error-api-connect")});
        }
      });
    });
  }
  
  completeRegistration() {
    apiManager.glewlwydRequest("/" + this.state.config.params.register + "/profile/complete", "POST")
    .then(() => {
      this.setState({registerComplete: true, username: ""}, () => {
        messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("profile.register-profile-completed")});
        messageDispatcher.sendMessage('App', {type: "registrationComplete"});
      });
    })
    .fail((err) => {
      if (err.status !== 400) {
        messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("error-api-connect")});
      } else {
        messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("profile.register-profile-incomplete")});
      }
    });
  }
  
  cancelRegistration() {
    messageDispatcher.sendMessage('App', {type: "confirm", title: i18next.t("profile.register-profile-cancel-title"), message: i18next.t("profile.register-profile-cancel-message"), callback: this.confirmCancelRegistration});
  }
  
  confirmCancelRegistration(result) {
    if (result) {
      apiManager.glewlwydRequest("/" + this.state.config.params.register + "/profile", "DELETE")
      .then(() => {
        this.setState({username: "", usernameValid: false, email: "", verificationSent: false, code: "", validMessage: false, invalidMessage: false}, () => {
          messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("profile.register-profile-cancelled")});
          messageDispatcher.sendMessage('App', {type: "registration"});
        });
      })
      .fail(() => {
        messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("error-api-connect")});
      });
    }
    messageDispatcher.sendMessage('App', {type: "closeConfirm"});
  }
  
  updatePassword() {
    this.setState({modifyPassword: true});
  }
  
  changeLang(e, lang) {
    this.setState({registerDefaultLang: lang});
  }
  
  render() {
    var formJsx, completeMessageJsx, passwordJsx, emailJsx, suggestionUsernameJsx;
    if (this.state.suggestionUsername) {
      suggestionUsernameJsx =
        <div>
          <a className="badge badge-info" href="#" onClick={this.selectSuggestion}>
            {i18next.t("profile.register-username-suggestion", {username: this.state.suggestionUsername})}
          </a>
        </div>
    }
    if (this.state.registerComplete) {
      var completeLink = [];
      if (this.state.config["register-complete"] && this.state.config["register-complete"].length) {
        this.state.config["register-complete"].forEach((complete, index) => {
          completeLink.push(<a key={index} className="btn btn-primary btn-icon-right" href={complete["complete-link"]}>{i18next.t(complete["complete-link-label"])}</a>);
        });
      }
      if (this.state.config.params.callback_url) {
        completeLink.push(<a key={completeLink.length} className="btn btn-primary btn-icon-right" href={decodeURI(this.state.config.params.callback_url)}>{i18next.t("callback.button-login")}</a>);
      } else if (this.state.registerProfile.callback_url) {
        completeLink.push(<a key={completeLink.length} className="btn btn-primary btn-icon-right" href={decodeURI(this.state.registerProfile.callback_url)}>{i18next.t("callback.button-login")}</a>);
      }
      
      if (!completeLink.length) {
        completeLink.push(
        <a key={completeLink.length} className="btn btn-primary" href={this.state.config.ProfileUrl}>{i18next.t("profile.register-profile-complete-link")}</a>
        );
      }
      
      completeMessageJsx = 
      <div>
        <div className="alert alert-info" role="alert">
          {i18next.t("profile.register-profile-complete-message")}
        </div>
        <div>
          {completeLink}
        </div>
      </div>
    } else if (this.state.registerProfile) {
      var completeSteps = [], completeMessage;
      if (this.state.registerConfig["set-password"] === "always" && !this.state.registerProfile.password_set) {
        completeSteps.push(
        <li key={0}>
          {i18next.t("profile.register-profile-complete-step-password")}
        </li>
        );
      }
      if (this.state.registerConfig.schemes) {
        this.state.registerConfig.schemes.forEach((scheme, index) => {
          if (scheme.register == "always" && !this.state.registerSchemes[scheme.name]) {
            completeSteps.push(
            <li key={index+1}>
              {i18next.t("profile.register-profile-complete-step-scheme", {scheme: scheme.display_name||scheme.name})}
            </li>
            );
          }
        });
      }
      if (completeSteps.length) {
        completeMessage =
          <div className="alert alert-danger" role="alert">
            {i18next.t("profile.register-profile-complete-steps")}
            <ul>
              {completeSteps}
            </ul>
            <button className="btn btn-primary btn-icon"
                    type="button" 
                    disabled={true}
                    title={i18next.t("profile.register-profile-complete")}>
              {i18next.t("profile.register-profile-complete")}
            </button>
            <button className="btn btn-primary"
                    type="button" 
                    onClick={() => this.cancelRegistration()} 
                    title={i18next.t("profile.register-profile-cancel")}>
              {i18next.t("profile.register-profile-cancel")}
            </button>
          </div>
      } else {
        completeMessage = 
          <div className="alert alert-info" role="alert">
            {i18next.t("profile.register-profile-complete-possible")}
            <div>
              <button className="btn btn-primary btn-icon"
                      type="button" 
                      onClick={() => this.completeRegistration()} 
                      title={i18next.t("profile.register-profile-complete")}>
                {i18next.t("profile.register-profile-complete")}
              </button>
              <button className="btn btn-primary"
                      type="button" 
                      onClick={() => this.cancelRegistration()} 
                      title={i18next.t("profile.register-profile-cancel")}>
                {i18next.t("profile.register-profile-cancel")}
              </button>
            </div>
          </div>
      }
      if (this.state.registerConfig["set-password"] !== "no") {
        var editButton = "";
        if (!this.state.modifyPassword && this.state.registerProfile.password_set) {
          editButton = 
            <button type="button" className="btn btn-outline-secondary btn-sm btn-icon-right" onClick={this.updatePassword}>
              <i className="fas fa-edit"></i>
            </button>
        }
        passwordJsx =
        <div>
          <hr/>
          <label htmlFor="password-input">
            {i18next.t("profile.register-password-label")}
            {editButton}
          </label>
          <div className="input-group">
            <input type="password" 
                   className={"form-control"} 
                   id="password-input"
                   placeholder={((!this.state.modifyPassword && this.state.registerProfile.password_set)?i18next.t("profile.register-password-set-ph"):i18next.t("profile.register-password-ph", {car: this.state.config.PasswordMinLength||8}))} 
                   disabled={!this.state.modifyPassword && this.state.registerProfile.password_set}
                   onChange={(e) => this.changePassword(e)} 
                   value={this.state.password}/>
          </div>
          <label htmlFor="confirm-password-input">{i18next.t("profile.register-confirm-password-label")}</label>
          <div className="input-group mb-3">
            <input type="password" 
                   className={"form-control"} 
                   id="confirm-password-input"
                   disabled={!this.state.modifyPassword && this.state.registerProfile.password_set}
                   placeholder={i18next.t((!this.state.modifyPassword && this.state.registerProfile.password_set?"profile.register-password-set-ph":"profile.register-confirm-password-ph"))} 
                   onChange={(e) => this.changeConfirmPassword(e)} 
                   value={this.state.passwordConfirm}/>
          </div>
          {this.state.invalidPassword?<span className="badge badge-danger">{this.state.invalidPassword}</span>:""}
        </div>
      }
      if (this.state.registerConfig["verify-email"]) {
        emailJsx =
        <div>
          <hr/>
          <label htmlFor="email-input">{i18next.t("profile.register-email-label")}</label>
          <div className="input-group">
            <input type="text" 
                   className={"form-control"} 
                   id="email-input"
                   disabled={true}
                   value={this.state.registerProfile.email||""}/>
          </div>
        </div>
      }
      formJsx =
        <form className="needs-validation" noValidate onSubmit={(e) => this.noSubmit(e)}>
          <label htmlFor="username-input">{i18next.t("profile.register-profile-username-label")}</label>
          <div className="input-group">
            <input type="text" 
                   className={"form-control"} 
                   value={this.state.registerProfile.username}
                   disabled={true}/>
          </div>
          {emailJsx}
          <hr/>
          <label htmlFor="name-input">{i18next.t("profile.register-name-label")}</label>
          <div className="input-group mb-3">
            <input type="text" 
                   className={"form-control"} 
                   id="name-input"
                   placeholder={i18next.t("profile.register-name-ph")} 
                   onChange={(e) => this.changeName(e)} 
                   value={this.state.registerProfile.name||""}/>
            <div className="input-group-append">
            </div>
          </div>
          {passwordJsx}
          <button className="btn btn-secondary btn-icon" 
                  type="button" 
                  onClick={(e) => this.saveNameOrPassword(e)}
                  title={i18next.t("save")}>
            {i18next.t("save")}
          </button>
        </form>
    } else if (!this.state.registerProfile) {
      if (this.state.registerConfig["verify-email"]) {
        var buttonVerifyJsx, codeInputJsx, langListJsx;
        if (this.state.registerDefaultLang && this.state.registerConfig.languages.length > 1) {
          var langList = [];
          this.state.registerConfig.languages.forEach((lang, index) => {
            langList.push(<a key={index} className={"dropdown-item"+(this.state.registerDefaultLang===lang?" active":"")} href="#" onClick={(e) => this.changeLang(e, lang)}>{lang}</a>);
          });
          langListJsx = <div className="btn-group dropup" role="group">
            <button className="btn btn-success dropdown-toggle" 
                    type="button" 
                    id="register-profile-lang" 
                    data-toggle="dropdown" 
                    aria-haspopup="true" 
                    aria-expanded="false" 
                    disabled={!this.state.usernameValid || !this.state.email || !this.state.registerValid}>
              {this.state.registerDefaultLang}
            </button>
            <div className="dropdown-menu" aria-labelledby="register-profile-lang">
              {langList}
            </div>
          </div>;
        }
        if (this.state.verificationSent) {
          codeInputJsx =
            <div>
              <hr/>
              <label htmlFor="code-input">{i18next.t("profile.register-code-label")}</label>
              <div className="input-group">
                <input type="text" 
                       className={"form-control"} 
                       id="code-input"
                       placeholder={i18next.t("profile.register-code-ph")} 
                       onChange={(e) => this.changeCode(e)} 
                       value={this.state.code}/>
              </div>
              {this.state.invalidCode?<span className="badge badge-danger">{i18next.t("profile.register-code-error")}</span>:""}
            </div>
          buttonVerifyJsx = 
            <div>
              <button className="btn btn-success btn-icon" 
                      type="button" 
                      onClick={() => this.verifyCode()} 
                      title={i18next.t("profile.register-profile-verify-code")}>
                {i18next.t("profile.register-profile-verify-code")}
              </button>
              <div className="btn-group" role="group">
                <button className="btn btn-success" 
                        type="button" 
                        onClick={() => this.sendVerificationEmail()} 
                        title={i18next.t("profile.register-profile-reverify-email")}>
                  {i18next.t("profile.register-profile-reverify-email")}
                </button>
                {langListJsx}
              </div>
            </div>
        } else {
          buttonVerifyJsx = 
            <div className="btn-group" role="group">
              <button className="btn btn-success" 
                      type="button" 
                      onClick={() => this.sendVerificationEmail()} 
                      disabled={!this.state.usernameValid || !this.state.email || !this.state.registerValid}
                      title={i18next.t("profile.register-profile-verify-email")}>
                {i18next.t("profile.register-profile-verify-email")}
              </button>
              {langListJsx}
            </div>
        }
        if (this.state.registerConfig["email-is-username"]) {
          formJsx = 
            <form className="needs-validation" noValidate onSubmit={(e) => this.noSubmit(e)}>
              <label htmlFor="email-input">{i18next.t("profile.register-email-label")}</label>
              <div className="input-group mb-3">
                <input type="text" 
                       className={"form-control"} 
                       id="email-input"
                       placeholder={i18next.t("profile.register-email-ph")} 
                       onChange={(e) => this.changeEmailAsUsername(e)} 
                       disabled={this.state.verificationSent || !this.state.registerValid}
                       value={this.state.email}/>
                <div className="input-group-append">
                  <span className="input-group-text">
                    <i className={(this.state.checkingEmail?"fas fa-compass fa-spin":this.state.usernameValid?"fas fa-check":"fas fa-exclamation")}></i>
                  </span>
                </div>
              </div>
              {!this.state.email?<span className="badge badge-danger">{i18next.t("profile.register-email-error")}</span>:""}
              {!this.state.usernameValid&&this.state.email?<span className="badge badge-danger">{i18next.t("profile.register-username-error")}</span>:""}
              {this.state.validMessage?<span className="badge badge-success">{i18next.t("profile.register-username-valid")}</span>:""}
              {this.state.checkingEmail?<span className="badge badge-info">{i18next.t("profile.register-username-checking")}</span>:""}
              {codeInputJsx}
              <hr/>
              <div className="input-group-append">
                {buttonVerifyJsx}
              </div>
            </form>
        } else {
          formJsx = 
            <form className="needs-validation" noValidate onSubmit={(e) => this.noSubmit(e)}>
              <label htmlFor="username-input">{i18next.t("profile.register-username-label")}</label>
              <div className="input-group mb-3">
                <input type="text" 
                       className={"form-control"} 
                       id="username-input"
                       placeholder={i18next.t("profile.register-username-ph")} 
                       onChange={(e) => this.changeUsername(e)} 
                       disabled={!this.state.registerValid}
                       value={this.state.username}/>
                <div className="input-group-append">
                  <span className="input-group-text">
                    <i className={(this.state.checkingUsername?"fas fa-compass fa-spin":this.state.invalidMessage?"fas fa-exclamation":"fas fa-check")}></i>
                  </span>
                </div>
              </div>
              {this.state.invalidMessage?<span className="badge badge-danger">{i18next.t("profile.register-username-error")}</span>:""}
              {this.state.validMessage?<span className="badge badge-success">{i18next.t("profile.register-username-valid")}</span>:""}
              {!this.state.validMessage&&!this.state.invalidMessage?<span className="badge badge-info">{i18next.t("profile.register-username-empty")}</span>:""}
              {suggestionUsernameJsx}
              <hr/>
              <label htmlFor="email-input">{i18next.t("profile.register-email-label")}</label>
              <div className="input-group">
                <input type="text" 
                       className={"form-control"} 
                       id="email-input"
                       placeholder={i18next.t("profile.register-email-ph")} 
                       onChange={(e) => this.changeEmailVerification(e)} 
                       disabled={this.state.verificationSent || !this.state.registerValid}
                       value={this.state.email}/>
              </div>
              {this.state.invalidEmailMessage?<span className="badge badge-danger">{i18next.t("profile.register-email-error")}</span>:""}
              {codeInputJsx}
              <hr/>
              <div className="input-group-append">
                {buttonVerifyJsx}
              </div>
            </form>
        }
      } else {
        formJsx = 
          <form className="needs-validation" noValidate onSubmit={(e) => this.noSubmit(e)}>
            <label htmlFor="username-input">{i18next.t("profile.register-username-label")}</label>
            <div className="input-group mb-3">
              <input type="text" 
                     className={"form-control"} 
                     id="username-input"
                     placeholder={i18next.t("profile.register-username-ph")} 
                     onChange={(e) => this.changeUsername(e)} 
                     disabled={!this.state.registerValid}
                     value={this.state.username}/>
              <div className="input-group-append">
                <span className="input-group-text">
                  <i className={(this.state.checkingUsername?"fas fa-compass fa-spin":this.state.invalidMessage?"fas fa-exclamation":"fas fa-check")}></i>
                </span>
              </div>
            </div>
            {this.state.invalidMessage?<span className="badge badge-danger">{i18next.t("profile.register-username-error")}</span>:""}
            {this.state.validMessage?<span className="badge badge-success">{i18next.t("profile.register-username-valid")}</span>:""}
            {!this.state.validMessage&&!this.state.invalidMessage?<span className="badge badge-info">{i18next.t("profile.register-username-empty")}</span>:""}
            {suggestionUsernameJsx}
            <hr/>
            <div className="input-group-append">
              <button className="btn btn-success"
                      type="button" 
                      onClick={() => this.registerUsername()} 
                      disabled={!this.state.usernameValid || !this.state.registerValid}
                      title={i18next.t("profile.register-username-create")}>
                {i18next.t("profile.register-profile-create")}
              </button>
            </div>
          </form>
      }
    }
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <h4>{i18next.t("profile.register-title")}</h4>
          </div>
        </div>
        {completeMessageJsx}
        <div className="row">
          <div className="col-md-6">
            {formJsx}
          </div>
        </div>
        <hr/>
        {completeMessage}
      </div>
    );
  }
}

export default Register;
