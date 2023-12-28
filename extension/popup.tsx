import { useState, useEffect } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import type { RequestBody, ResponseBody } from "~background/messages/config"
import short_uid from 'short-uuid';
import "./style.scss"
import { load_data, save_data } from './function';
import Button from "~components/button";
import Input from "~components/input";
// import type { RadioChangeEvent } from 'antd';
// import { Radio } from 'antd';

function IndexPopup() {
  let init: Object = {
    // "endpoint": "http://127.0.0.1:8088",
    "endpoint": "https://login-sync.laplace.id",
    // "password": "",
    "password": String(short_uid.generate()),
    "interval": 5,
    "domains": "bilibili.com",
    "uuid": String(short_uid.generate()),
    "type": "up",
    "keep_live": "",
    "with_storage": 0,
    "blacklist": "google.com",
    "headers": ""
  };
  const [data, setData] = useState(init);
  const [isLoading, setIsLoading] = useState(false)

  async function test(action='测试')
  {
    console.log("request,begin");
    setIsLoading(true)
    if( !data['endpoint'] || !data['password'] || !data['uuid'] || !data['type'] )
    {
      setIsLoading(false)
      alert('请填写完整的信息');
      return;
    }
    if( data['type'] == 'pause' )
    {
      setIsLoading(false)
      alert('暂停状态不能'+action);
      return;
    }
    const ret = await sendToBackground<RequestBody, ResponseBody>({name:"config",body:{payload:{...data,no_cache:1}}});
    console.log(action+"返回",ret);
    if( ret && ret['message'] == 'done' )
    {
      if( ret['note'] )
        alert(ret['note']);
      else
        alert(action+'成功');
    }else
    {
      alert(action+'失败，请检查填写的信息是否正确');
    }
    setIsLoading(false)
  }

  async function save(push: boolean)
  {
    if( !data['endpoint'] || !data['password'] || !data['uuid'] || !data['type'] )
    {
      alert('请填写完整的信息');
      return;
    }
    await save_data( "COOKIE_SYNC_SETTING", data );
    const ret = await load_data("COOKIE_SYNC_SETTING") ;
    console.log( "load", ret );
    if( JSON.stringify(ret) == JSON.stringify(data) )
    {
      push && test('手动同步')
      alert('保存成功');
      // window.close();
    }
  }

  function onChange(name:string, e:(React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>))
  {
    // console.log( "e" , name , e.target.value );
    setData({...data,[name]:e.target.value??''});
  }

  function uuid_regen()
  {
    setData({...data,'uuid':String(short_uid.generate())});
  }

  function password_gen()
  {
    setData({...data,'password':String(short_uid.generate())});
  }

  function loginSyncTokenGenerate() {
    setData({
      ...data,
      'uuid':String(short_uid.generate()),
      'password':String(short_uid.generate()),
    });
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert('已拷贝到剪切板');
    } catch (err) {
      alert(`拷贝至剪切板出错：${err}`);
    }
  }

  useEffect(() => {
    async function load_config()
    {
      const ret = await load_data("COOKIE_SYNC_SETTING") ;
      if( ret )  setData({...data,...ret});
    }
    load_config();
  },[]);

  return <div className="w-128 overflow-x-hidden bg-white dark:bg-neutral-800" style={{"width":"360px"}}>
    <div className="form p-3">
      <div className="text-line text-gray-700 dark:text-neutral-300">
        {/* <div className="">工作模式</div> */}
        {/* <h1 className="text-xl font-bold">LAPLACE Login Sync</h1> */}

        {/* <p className="mb-2">请确保 <a href={'https://www.bilibili.com'} target='_blank'>网站已登录</a>，然后点击「保存并同步」</p> */}

        {data['uuid'] && data['uuid'] === init['uuid'] && (
          <div className="bg-orange-400 text-white p-2 mb-2 rounded">{chrome.i18n.getMessage('notInitialized')}</div>
        )}

        <div className="flex gap-2 mb-2">
          <div className="flex gap-0.5">
            <input type="radio" id="up" name="working-method" value="up" checked={data['type'] === 'up'} onChange={e => onChange('type', e)} />
            <label htmlFor="up">{chrome.i18n.getMessage('syncLoginSessions')}</label>
          </div>

          {/* <div className="flex gap-0.5">
            <input type="radio" id="down" name="working-method" value="down" checked={data['type'] === 'down'} onChange={e => onChange('type', e)} />
            <label htmlFor="down">覆盖到浏览器</label>
          </div> */}

          <div className="flex gap-0.5">
            <input type="radio" id="pause" name="working-method" value="pause" checked={data['type'] === 'pause'} onChange={e => onChange('type', e)} />
            <label htmlFor="pause">{chrome.i18n.getMessage('pauseSyncing')}</label>
          </div>
        </div>

        {data['type'] && data['type'] == 'down' && <div className="bg-red-600 text-white p-2 my-2 rounded">
          覆盖模式主要用于云端和只读用的浏览器，请勿同时覆盖过多浏览器实例，否则可能会导致平台风控登出当前账号
        </div>}

        {data['type'] && data['type'] != 'pause' && <>
        {/* <div className="">服务器地址</div>
        <input type="text" className="border-1  my-2 p-2 rounded w-full" placeholder="请输入服务器地址" value={data['endpoint']} onChange={e=>onChange('endpoint',e)} /> */}
        {/* <div className="">同步密钥</div> */}
        <div className="flex flex-row">
          <div className="left flex-1">
          <Input type="text" className="border-1  my-1 p-2 rounded w-full" placeholder="端对端用户密钥" value={`${data['uuid']}@${data['password']}`} readOnly />
          </div>
          <div className="right">
          <Button className="p-2 my-1 ml-2" onClick={() => copyToClipboard(`${data['uuid']}@${data['password']}`)}>{chrome.i18n.getMessage('copyToken')}</Button>
          <Button className="ml-2" color="red" onClick={()=>setData(init)} disabled={isLoading}>{chrome.i18n.getMessage('reset')}</Button>

          {/* {data['uuid'] !== init['uuid'] && (
            <Button className="p-2 my-1 ml-2" color="red" onClick={() => loginSyncTokenGenerate()} disabled={isLoading}>重新生成</Button>
          )} */}
          </div>
        </div>

        {/* <div className="">用户KEY</div>
        <div className="flex flex-row">
          <div className="left flex-1">
          <input type="text" className="border-1  my-2 p-2 rounded w-full" placeholder="唯一用户ID" value={data['uuid']}  onChange={e=>onChange('uuid',e)}/>
          </div>
          <div className="right">
          <button className="p-2 rounded my-2 ml-2" onClick={()=>uuid_regen()}>重新生成</button>
          </div>
        </div>
        <div className="">端对端加密密码</div>
        <div className="flex flex-row">
          <div className="left flex-1">
          <input type="text" className="border-1  my-2 p-2 rounded w-full" placeholder="丢失后数据失效，请妥善保管" value={data['password']}  onChange={e=>onChange('password',e)}/>
          </div>
          <div className="right">
          <button className="p-2 rounded my-2 ml-2" onClick={()=>password_gen()}>自动生成</button>
          </div>
        </div> */}

        {/* <div className="">同步时间间隔·分钟</div>
        <input type="number" className="border-1  my-2 p-2 rounded w-full" placeholder="最少10分钟" value={data['interval']} onChange={e=>onChange('interval',e)} /> */}

        {data['type'] && data['type'] == 'up' && <>
          {/* <div className="">是否同步Local Storage</div>
          <div className="my-2">
            <input type="radio" id="with-localstorage-on" name="with-localstorage" value={1} checked={data['with_storage'] === '1'} onChange={e => onChange('with_storage', e)} />
            <label htmlFor="with-localstorage-on">是</label>

            <input type="radio" id="with-localstorage-off" name="with-localstorage" value={0} checked={data['with_storage'] === '0'} onChange={e => onChange('with_storage', e)} />
            <label htmlFor="with-localstorage-off">否</label>
          </div> */}

          {/* <div className="">请求Header·选填</div>
          <textarea className="border-1  my-2 p-2 rounded w-full" style={{"height":"60px"}} placeholder="在请求时追加Header，用于服务端鉴权等场景，一行一个，格式为'Key:Value'，不能有空格"  onChange={e=>onChange('headers',e)} value={data['headers']}/>

          <div className="">同步域名关键词·选填</div>
          <textarea className="border-1  my-2 p-2 rounded w-full" style={{"height":"60px"}} placeholder="一行一个，同步包含关键词的全部域名，如qq.com,jd.com会包含全部子域名，留空默认同步全部"  onChange={e=>onChange('domains',e)} value={data['domains']}/>

          <div className="">同步域名黑名单·选填</div>
          <textarea className="border-1  my-2 p-2 rounded w-full" style={{"height":"60px"}} placeholder="黑名单仅在同步域名关键词为空时生效。一行一个域名，匹配则不参与同步"  onChange={e=>onChange('blacklist',e)} value={data['blacklist']}/> */}

          {/* <div className="">Cookie保活·选填</div>
          <textarea className="border-1  my-2 p-2 rounded w-full" style={{"height":"60px"}} placeholder="定时后台刷新URL，模拟用户活跃。一行一个URL，默认60分钟，可用 URL|分钟数 的方式指定刷新时间"  onChange={e=>onChange('keep_live',e)} value={data['keep_live']}/> */}
        </>}
        </>}

        {data['type'] && data['type'] == 'pause' && <>
        <div className="bg-orange-400 text-white p-2 my-2 rounded">
          {chrome.i18n.getMessage('loginSyncPaused')}
        </div>
        </>}
        <div className="flex flex-row justify-between mt-2">
          <div className="left text-gray-400">
            {data['type'] && data['type'] != 'pause' && <>
              {/* <Button className="mr-2" color="light" onClick={()=>test('手动同步')} disabled={isLoading}>手动同步</Button> */}
              {/* <Button className="mr-2" color="red" onClick={()=>setData(init)} disabled={isLoading}>重置密钥</Button> */}
              {/* <Button className="" color="light" onClick={()=>test('测试')} disabled={isLoading}>测试</Button> */}
            </>}

          </div>
          <div className="right">
            <Button
              className=""
              onClick={() => {
                save(data['type'] && data['type'] == 'pause' ? false : true)
              }}
              disabled={isLoading}
            >
              {data['type'] && data['type'] == 'pause' ? chrome.i18n.getMessage('save') : chrome.i18n.getMessage('saveAndSync')}
            </Button>
          </div>
        </div>

        <hr className="my-3" />

        {/* <div className="flex gap-2">
          <a href={'https://www.bilibili.com'} target='_blank'>访问哔哩哔哩</a>
          <a href={'https://chat.laplace.live'} target="_blank">访问 LAPLACE Chat</a>
        </div> */}

        <div className="text-gray-500 dark:text-neutral-400">
          {/* <p><a href={'https://chat.laplace.live'} target="_blank">LAPLACE Login Sync</a>, based on <a href={'https://github.com/easychen/CookieCloud'} target="_blank">CookieCloud</a></p> */}
          <p>Brought to you by <a href={'https://laplace.live'} target="_blank">LAPLACE</a>, based on <a href={'https://github.com/easychen/CookieCloud'} target="_blank">CookieCloud</a></p>
          <p>Make the web fun again</p>
        </div>

      </div>
    </div>
  </div>
}

export default IndexPopup
