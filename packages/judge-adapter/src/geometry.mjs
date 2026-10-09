// Bounded exact-integer geometry for trusted declarative input checks.
export const orientation=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
export const onSegment=(p,a,b)=>orientation(a,b,p)===0&&p[0]>=Math.min(a[0],b[0])&&p[0]<=Math.max(a[0],b[0])&&p[1]>=Math.min(a[1],b[1])&&p[1]<=Math.max(a[1],b[1]);
export function segmentsIntersect(a,b,c,d){const p=orientation(a,b,c),q=orientation(a,b,d),r=orientation(c,d,a),s=orientation(c,d,b);return onSegment(c,a,b)||onSegment(d,a,b)||onSegment(a,c,d)||onSegment(b,c,d)||((p<0&&q>0)||(p>0&&q<0))&&((r<0&&s>0)||(r>0&&s<0));}
export function simplePolygon(points){
 if(!Array.isArray(points)||points.length<3||points.length>200||points.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isInteger(v)||Math.abs(v)>1000000)))return false;
 const n=points.length;let twiceArea=0;
 for(let i=0;i<n;i++){const a=points[i],b=points[(i+1)%n],c=points[(i+2)%n];if(a[0]===b[0]&&a[1]===b[1])return false;twiceArea+=a[0]*b[1]-a[1]*b[0];if(orientation(a,b,c)===0&&(b[0]-a[0])*(c[0]-b[0])+(b[1]-a[1])*(c[1]-b[1])<0)return false;}
 if(twiceArea===0||!Number.isSafeInteger(twiceArea))return false;
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){if(j===i+1||i===0&&j===n-1)continue;if(segmentsIntersect(points[i],points[(i+1)%n],points[j],points[(j+1)%n]))return false;}
 return true;
}
