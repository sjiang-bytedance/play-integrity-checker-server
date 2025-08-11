import { google } from "googleapis";
const playintegrity = google.playintegrity('v1');


const packageName = process.env.PACKAGE_NAME
// const privatekey = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
const decoded = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_B64, 'base64').toString();
const privatekey = JSON.parse(decoded);

async function getJwtClient() {
  return new google.auth.JWT(
    privatekey.client_email,
    null,
    privatekey.private_key,
    ['https://www.googleapis.com/auth/playintegrity']
  );
}

async function writeDeviceRecall(token) {
  const jwtClient = await getJwtClient();
  await jwtClient.authorize();

  const url = `https://playintegrity.googleapis.com/v1/${encodeURIComponent(packageName)}/deviceRecall:write`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtClient.credentials.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      integrityToken: token,
      newValues: { bitSecond: true }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error writing deviceRecall: ${response.status} ${errorText}`);
  }
  return response.json();
}

async function getTokenResponse(token) {
  const jwtClient = await getJwtClient();
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
        await writeDeviceRecall(token);

        // Then decode the token (may not reflect change immediately)
        const decoded = await getTokenResponse(token);
        res.status(200).send(decoded);
    } catch (e) {
        console.error(e);
        res.status(500).send({ error: 'Google API error: ' + e.message });
    }
};