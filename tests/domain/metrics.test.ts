import { describe,it,expect } from 'vitest';
import { computeMetrics } from '../../src/domain/metrics';
import { computeAgreement } from '../../src/domain/agreement';
import { projectSchema } from '../../src/domain/schema';
const segment={id:'s',sessionId:'a',lengthM:400,relation:'single' as const,latitude:37,longitude:127};
const device=(id:string,status:string|null='normal',kind='shared-scooter')=>({id,segmentId:'s',canonicalDeviceId:id,kind,photoId:'p',judgments:{},final:status?{kind,status,risks:[],fallen:false,reason:'checked'}:undefined});
describe('research metrics',()=>{
it('normalizes distance and excludes unresolved status from ratio',()=>{const o=[device('1','danger'),device('2','obstruction'),device('3','danger'),device('4'),device('5'),device('6'),device('7','unassessable'),device('8',null)]; const m=computeMetrics([segment],o as never);expect(m.density).toBe(2);expect(m.ratio).toBe(.5);expect(m.unreviewed).toBe(1);expect(m.unassessable).toBe(1)});
it('does not invent a percentage for an empty sample',()=>{expect(computeMetrics([segment],[])).toMatchObject({density:0,ratio:null,total:0})});
it('excludes private and unknown devices',()=>{expect(computeMetrics([segment],[device('1','normal','private'),device('2','danger','unknown')] as never).total).toBe(0)});
it('counts repeated photos of a device once in one session',()=>{const duplicate={...device('2'),canonicalDeviceId:'1'};expect(computeMetrics([segment],[device('1'),duplicate] as never).total).toBe(1)});
it('counts canonical identities separately in different sessions',()=>{const b={...segment,id:'b',sessionId:'b'};expect(computeMetrics([segment,b],[device('1'),{...device('2'),segmentId:'b',canonicalDeviceId:'1'}] as never).total).toBe(2)});
it('rejects zero distance',()=>{expect(()=>computeMetrics([{...segment,lengthM:0}],[])).toThrow()});
it('counts each risk once per device',()=>{const d=device('1','danger');d.final!.risks=['tactile','crosswalk','tactile'] as never;expect(computeMetrics([segment],[d] as never).risks).toEqual({tactile:1,crosswalk:1})});
it('unknown ownership cannot contribute to numerator',()=>{expect(computeMetrics([segment],[device('1','danger','unknown'),device('2')] as never).ratio).toBe(0)});
});
it('agreement uses paired assessable judgments only',()=>{const j=(status:string)=>({kind:'shared-scooter',status,risks:[],fallen:false,reason:''});expect(computeAgreement([{left:j('normal'),right:j('normal')},{left:j('normal'),right:j('danger')},{left:j('unassessable'),right:j('normal')},{left:j('danger')}] as never)).toEqual({matched:1,total:2,excluded:2,rate:.5})});
it('rejects corrupted project import',()=>{expect(projectSchema.safeParse({version:1,sessions:[],segments:[{...segment,latitude:200}],photos:[],observations:[]}).success).toBe(false)});

