export async function GET() {
  try {
    console.log('Test endpoint called');
    console.log('ECHO_APP_ID:', process.env.ECHO_APP_ID);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    return Response.json({
      status: 'ok',
      echoAppId: process.env.ECHO_APP_ID ? 'present' : 'missing',
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Test error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}