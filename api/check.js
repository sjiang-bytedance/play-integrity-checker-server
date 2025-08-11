import { google } from "googleapis";
const playintegrity = google.playintegrity('v1');


const packageName = process.env.PACKAGE_NAME
// const privatekey = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
const decoded = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_B64, 'base64').toString();
const privatekey = JSON.parse(decoded);

async function writeDeviceRecall(token, newValues) {
  let jwtClient = new google.auth.JWT(
        privatekey.client_email,
        null,
        privatekey.private_key,
        ['https://www.googleapis.com/auth/playintegrity']);

  google.options({ auth: jwtClient });

  const res = await playintegrity.v1.deviceRecall.write({
        packageName,
        requestBody: {
            integrityToken: token,
            newValues: { bitFirst: true }
        }
    });
  return res.data;
}

async function getTokenResponse(token) {

    let jwtClient = new google.auth.JWT(
        privatekey.client_email,
        null,
        privatekey.private_key,
        ['https://www.googleapis.com/auth/playintegrity']);

    google.options({ auth: jwtClient });

    const res = await playintegrity.v1.decodeIntegrityToken(
        {
            packageName: packageName,
            requestBody:{
                "integrityToken": token
            }
        }

    );


    // console.log(res.data.tokenPayloadExternal);
    console.log(
      JSON.stringify(res.data.tokenPayloadExternal, null, 2)
    );

    return res.data.tokenPayloadExternal
}

// module.exports = async (req, res) => {

//     const { token = 'none'} = req.query
    
//     if (token == 'none') {
//         res.status(400).send({ 'error': 'No token provided' })
//         return
//     }

//     getTokenResponse(token)
//         .then(data => {
//             res.status(200).send(data)
//             return
//         })
//         .catch(e => {
//             console.log(e)
//             res.status(200).send({ 'error': 'Google API error.\n' + e.message })
//             return
//         });
// }


export default async (req, res) => {
    const { token = 'none' } = req.query;

    if (token === 'none') {
        res.status(400).send({ error: 'No token provided' });
        return;
    }

    try {
        // Always modify device recall first
        // await writeDeviceRecall(token);

        // Then decode the token (may not reflect change immediately)
        const decoded = await getTokenResponse(token);
        res.status(200).send(decoded);
    } catch (e) {
        console.error(e);
        res.status(500).send({ error: 'Google API error: ' + e.message });
    }
};