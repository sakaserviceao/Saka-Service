import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const type = formData.get('type') as string;
    const folderId = formData.get('folderId') as string;

    if (!file || !userId) {
      throw new Error('File and UserID are required');
    }

    // 1. Get Service Account from Secrets
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT secret not configured');
    }
    const serviceAccount = JSON.parse(serviceAccountJson);

    // 2. Obtain Google Auth Token
    const jwtHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;
    const jwtClaim = btoa(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/drive.file",
      aud: "https://oauth2.googleapis.com/token",
      iat,
      exp
    }));

    // In a real environment, you'd use a library like 'djwt' or 'jose' to sign this.
    // For this example, we assume you have a way to obtain a token or we use a simpler auth if possible.
    // Since we need to sign the JWT with the private key (RS256), here is the standard Deno approach:
    
    const key = await crypto.subtle.importKey(
      "pkcs8",
      new TextEncoder().encode(serviceAccount.private_key.replace(/\\n/g, '\n')),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const unsignedJwt = `${jwtHeader}.${jwtClaim}`;
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(unsignedJwt)
    );
    const signedJwt = `${unsignedJwt}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")}`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`,
    });

    const { access_token } = await tokenResponse.json();

    // 3. Upload to Google Drive
    const metadata = {
      name: `${userId}_${type}_${Date.now()}.${file.name.split('.').pop()}`,
      parents: [folderId],
    };

    const multiPartData = new FormData();
    multiPartData.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    multiPartData.append("file", file);

    const driveResponse = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${access_token}` },
        body: multiPartData,
      }
    );

    const driveResult = await driveResponse.json();

    if (!driveResponse.ok) {
      throw new Error(`Google Drive Error: ${JSON.stringify(driveResult)}`);
    }

    return new Response(JSON.stringify(driveResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
