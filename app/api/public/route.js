export const dynamic='force-dynamic';
// Public order access is permanently disabled, regardless of saved workspace settings.
export async function GET(){return Response.json({error:'Login is required to view orders.',orders:[],workspaces:[]},{status:401,headers:{'Cache-Control':'no-store'}})}
