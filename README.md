# backend

# Endpoints
```
ENDPOINT    		STATUS			DESCRIPTION
/user
  /create			IMPLEMENTED		Creates a new user
  /delete			NOT STARTED		Deletes a user
  /changePassword	NOT STARTED		Changes the password of a user
  /change			NOT STARTED		Changes a value for a user
  /me				IMPLEMENTED		Sends info about the logged in user
/image
  /upload			IMPLEMENTED		Uploads an images and receives an id
  /download			IMPLEMENTED		Downloads an image from an id
/proof
  /create			IMPLEMENTED		Creates a new proof
  /image
    /add			IMPLEMENTED		Adds an image for a proof
    /delete			IMPLEMENTED		Deletes an image from a proof
  /score			IMPLEMENTED		Sets the score for the proof
/team
  /create			IMPLEMENTED
  /abandon			NOT STARTED
  /change			NOT STARTED
  /join				IMPLEMENTED
  /leave			IMPLEMENTED
  /invite
    /create			IMPLEMENTED
  /match
    /finish			IMPLEMENTED
	/resign			NOT STARTED
	/list			IMPLEMENTED
/tournament
  /create			IMPLEMENTED
  /isPublic			NOT STARTED
  /delete			IMPLEMENTED
  /list				IMPLEMENTED
  /match
    /list			IMPLEMENTED
  /round
    /list			IMPLEMENTED
/dispute
  /resove			IMPLEMENTED
  /list				IMPLEMENTED
```