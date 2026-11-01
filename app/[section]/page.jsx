import Hub from '../hub';
import { notFound } from 'next/navigation';
export default async function Page({params}){const {section}=await params;if(!['admin','confirm','pack','doc','del'].includes(section))notFound();return <Hub section={section}/>}
