const router = require('express').Router();
const {google} = require('googleapis')
const request = require('superagent');


// Google Calendar OAuth Integration

// refresh_token is issued only one time, the first time that user gives access to our app. Is our duty
// to save it in our database and use it later as we need. For the moment we are hard-coding it.

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
)

router.get('/', async (req, res, next) => {
    res.send({message: 'Ok api is working 🚀'});
});

router.post('/create-tokens', async (req, res, next) => {
    try {
        const {code} = req.body
        const {tokens} = await oauth2Client.getToken(code)
        res.send(tokens)
    } catch (error) {
        next(error)
    }
})

router.post('/create-event', async (req, res, next) => {
    try {
        const {summary, description, location, startDateTime, endDateTime} = req.body
        oauth2Client.setCredentials({refresh_token: process.env.GOOGLE_REFRESH_TOKEN})
        const calendar = google.calendar('v3')

        const event = {
            conferenceData: {
                createRequest: {
                    conferenceSolutionKey: {
                        type: "hangoutsMeet"
                    },
                    requestId: (Math.random() + 1).toString(36).substring(7)
                }
            },
            summary,
            description,
            location,
            colorId: '7',
            start: {
                dateTime: new Date(startDateTime)
            },
            end: {
                dateTime: new Date(endDateTime)
            },
            attendees: [
                {email: 'elianbraja@gmail.com'},
            ]
        }

        const response = await calendar.events.insert({
            auth: oauth2Client,
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
            sendNotifications: true
        })

        res.send(response)
    } catch (error) {
        console.log(error)
        next(Error)
    }
})


// LinkedIn OAuth Integration
router.post('/create-tokens-linkedin', async (req, res, next) => {
    try {
        const {code} = req.body
        requestAccessToken(code)
            .then((response) => {
                requestProfile(response.body.access_token)
                    .then(response => {
                        console.log(response.body)
                        res.send(response.body);
                    })
                    .catch((error) => {
                        res.status(500).send(`${error}`)
                        console.error(error)
                    })
            })
            .catch((error) => {
                console.error(error)
            })
    } catch (error) {
        console.log(error)
        next(error)
    }
})


function requestAccessToken(code) {
    return request.post('https://www.linkedin.com/oauth/v2/accessToken')
        .send('grant_type=authorization_code')
        .send(`redirect_uri=${process.env.LINKEDIN_REDIRECT_URI}`)
        .send(`client_id=${process.env.LINKEDIN_CLIENT_ID}`)
        .send(`client_secret=${process.env.LINKEDIN_CLIENT_SECRET}`)
        .send(`code=${code}`)
        .send(`state=123456`)
}

function requestProfile(access_token) {
    console.log(access_token)
    return request.get('https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~digitalmediaAsset:playableStreams))')
        .set('Authorization', `Bearer ${access_token}`)
}


module.exports = router;
