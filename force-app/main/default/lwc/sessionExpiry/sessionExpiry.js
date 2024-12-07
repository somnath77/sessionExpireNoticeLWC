import { LightningElement, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import USER_ID from '@salesforce/user/Id';
import getUserDetails from '@salesforce/apex/useHandlerClass.getUserDetails';

export default class SessionExpiry extends LightningElement {
    errorvar;
    siteUrl = 'ADD_SITE_URL_HERE';

    currentPageReference = null;
    urlstateParameters = null;
    displayLogoutButton = false;
    @track maxIdleTime = 15*60; // 15 minutes
    @track warnIdleTime = 14*60; // 14 minutes
    @track userName;
    @track wiredResult;
    @track showwarningModal = false;
    @track warningRemainingSeconds = 60;
    @track getCommentHeader = 'Session Expire Warning';
    @track refreshIntervalId;
    @track idleIntervalid;

    @wire(CurrentPageReference)
    getStateParameters (currentPageReference) {
        if (currentPageReference) {
            this.urlstateParameters = currentPageReference.attributes;
        }
        if(this.urlstateParameters.name =='Login'){
            this.displayLogoutButton=true;
        }
    }

    @wire (CurrentPageReference)
    getStateParameters (currentPageReference) {

        if (currentPageReference) {
            this.urlStateParameters = currentPageReference.attributes;

            if(this.urlstateParameters.name !=='Login'){
                this.displayLogoutButton=true;
                this.idleTimeTracker();
            }else{
                this.displayLogoutButton=false;
            }
        }
    }

    handleLogout(){
        window.location.replace(this.siteUrl+'/secur/logout.jsp');
    }

    idleTimeTracker() {
        sessionStorage.setItem('lastActivityTime', Date.now());
        window.addEventListener('keypress', this.resetIdleTimer);
        window.addEventListener('click', this.resetIdleTimer);

        if(Ithis.idleIntervalId)
            this.idleIntervalId = setInterval(this.checkIdleTime.bind(this), 1000); // runs every second
    }

    resetIdleTimer = () => {
        this.showWarningModal = false;
        sessionStorage.setItem('lastActivityTime', Date.now());
    }

    checkIdleTime(){
        const currentTime = Date.now();
        const lastActivity = parseInt(sessionStorage.getItem('lastActivityTime'), 10);
        const idleTimer = Math.floor((currentTime - lastActivity)/1000);

        if(idleTimer >= this.maxIdleTime) {
            clearInterval(this.idleIntervalId);
            this.handleLogout();
        }
        else if(idleTimer == this.warnIdleTime){
            this.showwarningModal = true;
            window.removeEventListener('keypress', this.resetIdleTimer);
            window.removeEventListener('click', this.resetIdleTimer);
            this.refreshIntervalId = setInterval(this.reduceWarningSeconds.bind(this), 1000); // runs every second
        }
    }

    handleDialogClose(){
        this.showWarningModal = false;
    }

    reduceWarningSeconds(){
        this.warningRemainingSeconds -= 1;

        if(this.warningRemainingSeconds == 0)
            clearInterval(this.refreshIntervalId);
    }

    handleContinueWorking(){
        this.resetIdleTimer();
        this.extendSession();
        this.warningRemainingSeconds = 60;
        clearInterval(this.refreshIntervalId);
        window.addEventListener('keypress', this.resetIdleTimer);
        window.addEventListener('click', this, resetIdleTimer);
    }

    async extendSession(){
        await getUserDetails ({userdId: USER_ID})
        .then(response => {
            console.log('response status' + response.Name);
            this.userName = response.Name;
        }).catch(error => {
            console.log('error status'+ error.body.message);
            if (error.status === 500 && error.body.message?.includes ('useHandlerClass')){
                this.handleLogout()
            }
        })
    }

    disconnectedCallback() {
        clearInterval(this.idleIntervalId);
        sessionStorage.removeItem('lastActivityTime');
        window.removeEventListener('keypress', this.resetIdleTimer);
        window.removeEventListener('click', this.resetIdleTimer);
    }
}