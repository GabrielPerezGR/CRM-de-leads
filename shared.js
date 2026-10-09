'use strict';
async function initShared(){
 const c=window.CRM_CONFIG;
 if(!c||!/^https:\/\//.test(c.url)||!c.key||c.key.includes('COLE_')){$('storage').textContent='Configure a URL e a chave pública no arquivo config.js antes de publicar.';return;}
 if(!window.supabase){$('storage').textContent='Não foi possível carregar o Supabase. Verifique a conexão e recarregue.';return;}
 if(c.key.startsWith('sb_secret_')){$('storage').textContent='Chave inválida: utilize somente a chave publicável ou anon.';return;}
 db=window.supabase.createClient(c.url,c.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 ready=true;
 channel=db.channel('carteira-unica').on('postgres_changes',{event:'*',schema:'public',table:'crm_leads'},()=>refresh()).subscribe(status=>{
 if(status==='SUBSCRIBED')refresh();
 else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))$('storage').textContent='Tempo real desconectado. Consultando a carteira a cada 15 segundos.';
 });await refresh();
 setInterval(()=>{if(ready&&navigator.onLine)refresh();},15000);
 window.addEventListener('online',()=>refresh());window.addEventListener('offline',()=>{$('storage').textContent='Sem internet. Alterações não serão salvas até reconectar.';});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
}
initShared().catch(e=>{$('storage').textContent='Falha na inicialização: '+e.message;});
