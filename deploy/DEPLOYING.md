# How to deploy ShakeGuard

Currently the deploy-to-production-server workflow is highly manual. The steps
are as follows:

* Log into the server via SSH.
* `cd` into the directory `/var/www/`.
* There may already be a Git repo at `/var/www/shakeguard`, if so, just `sudo git checkout` whichever branch you want to deploy.
    * Otherwise, `sudo git clone https://github.com/ShakeGuard/2800-202210-BBY06 /var/www/shakeguard` to clone the repo.
* `cd /var/www/shakeguard`, then run `npm ci` to install the packages from `package-lock.json`.
* This `deploy/` directory contains the systemd `shakeguard.service` file that 
is used to set the app running on a production server.
* Copy the `.service` file to `/etc/systemd/system/shakeguard.service`.
* Run `sudo systemctl daemon-reload` to update `systemd`'s configuration.
* Run `sudo systemctl start shakeguard.service` to start the service.
* Check that the service has started successfully with the command `systemctl status shakeguard.service`
    * If the service failed to start, check for errors with `journalctl -u shakeguard.service`.
