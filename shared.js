'use strict';
async function sessionChanged(session){
 ready=false;document.querySelector('main').hidden=true;$('authbox').hidden=false;$('logout').hidden=true;
 if(channel){await db.removeChannel(channel);channel=null;}
 if(!session){leads=[];state={};render();return;}
 const {data,error}=await db.from('crm_members').select('user_id').eq('user_id',session.user.id).maybeSingle();
 if(error||!data){$('authmessage').textContent=error?'Erro de acesso: '+error.message:'Sua conta não está autorizada. Peça ao responsável para adicionar seu UUID em crm_members.';$('logout').hidden=false;return;}
 ready=true;$('authmessage').textContent='';$('authbox').hidden=true;document.querySelector('main').hidden=false;$('logout').hidden=false;
 channel=db.channel('carteira-unica').on('postgres_changes',{event:'*',schema:'public',table:'crm_leads'},()=>refresh()).subscribe(status=>{
 if(status==='SUBSCRIBED')refresh();
 else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))$('storage').textContent='Tempo real desconectado. A carteira será consultada a cada 15 segundos.';
 });await refresh();
}
async function initShared(){
 const c=window.CRM_CONFIG;
 if(!c||!/^https:\/\//.test(c.url)||!c.key||c.key.includes('COLE_')){$('authmessage').textContent='Configure a URL e a chave pública no arquivo config.js antes de publicar.';return;}
 if(!window.supabase){$('authmessage').textContent='Não foi possível carregar o Supabase. Verifique a conexão e recarregue.';return;}
 if(c.key.startsWith('sb_secret_')){$('authmessage').textContent='Chave inválida: utilize somente a chave publicável ou anon.';return;}
 db=window.supabase.createClient(c.url,c.key);
 $('loginform').onsubmit=async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button');button.disabled=true;$('authmessage').textContent='Entrando…';try{const {data,error}=await db.auth.signInWithPassword({email:$('loginemail').value.trim(),password:$('loginpassword').value});if(error)throw error;$('loginpassword').value='';await sessionChanged(data.session);}catch(e){$('authmessage').textContent='Não foi possível entrar: '+e.message;}finally{button.disabled=false;}};
 $('logout').onclick=async()=>{const {error}=await db.auth.signOut();if(error){toast('Falha ao sair: '+error.message);return;}if($('modal').open)$('modal').close();await sessionChanged(null);};
 db.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')setTimeout(()=>sessionChanged(null),0);});
 const {data,error}=await db.auth.getSession();if(error)$('authmessage').textContent=error.message;else await sessionChanged(data.session);
 setInterval(()=>{if(ready&&navigator.onLine)refresh();},15000);
 window.addEventListener('online',()=>refresh());window.addEventListener('offline',()=>{$('storage').textContent='Sem internet. Alterações não serão salvas até reconectar.';});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
}
initShared().catch(e=>{$('authmessage').textContent='Falha na inicialização: '+e.message;});
