const router = require('express').Router();
const {google} = require('googleapis')

// refresh_token is issued only one time, the first time that user gives access to our app. Is our duty
// to save it in our database and use it later as we need. For the moment we are hard-coding it.

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
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
        oauth2Client.setCredentials({refresh_token: process.env.REFRESH_TOKEN})
        const calendar = google.calendar('v3')
        const response = await calendar.events.insert({
            auth: oauth2Client,
            calendarId: 'primary',
            requestBody: {
                summary,
                description,
                location,
                colorId: '7',
                start: {
                    dateTime: new Date(startDateTime)
                },
                end: {
                    dateTime: new Date(endDateTime)
                }
            }
        })
        res.send(response)
    } catch (error) {
        next(Error)
    }
})


module.exports = router;
