# backend

# Endpoints
```
ENDPOINT    		STATUS			DESCRIPTION
/user
  /create			IMPLEMENTED		Creates a new user
  /delete			NOT STARTED		Deletes a user
  /changePassword	IMPLEMENTED		Changes the password of a user
  /change			IMPLEMENTED		Changes a value for a user
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
  /change			IMPLEMENTED
  /join				IMPLEMENTED
  /leave			IMPLEMENTED
  /list				IMPLEMENTED
  /invite
    /create			IMPLEMENTED
  /match
    /finish			IMPLEMENTED
	/resign			IMPLEMENTED
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