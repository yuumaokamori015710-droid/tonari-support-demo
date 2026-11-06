(function(root){
 'use strict';
 const statuses=['依頼作成済み','支援担当が確認中','手配調整中','手配確定','合流待ち','合流済み','移動中','到着済み','手配不成立'];
 const riskNames=['','不安・違和感','明確なつきまとい','高リスク'];
 function allowed(status){const i=statuses.indexOf(status);return i<0||i>=7?[]:[statuses[i+1],statuses[8]];}
 function transition(request,next,reason=''){if(!allowed(request.status).includes(next))throw Error('許可されていない状態遷移です');if(next===statuses[8]&&!reason.trim())throw Error('手配不成立の理由が必要です');request.status=next;request.history.push({status:next,time:new Date().toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'}),reason:reason.trim()});}
 function risk(signs){return signs.includes('threat')?3:signs.includes('following')?2:signs.includes('unease')?1:0;}
 function report(records,to){const val=x=>String(x||'未記入・不明');return ['相談用の事実整理レポート（デモ）',`相談先：${to}`,`作成日時：${new Date().toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})}`,`記録件数：${records.length}件（記録件数と行為の回数は異なります）`,`入力された行為回数の合計：${records.reduce((n,r)=>n+(Number(r.count)||0),0)}回／回数不明の記録：${records.filter(r=>!r.count).length}件`,'本人の入力内容を整形したものです。事実認定・法的判断・危険予測は行っていません。',...records.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map((r,i)=>`\n【記録 ${i+1}】\nいつ：${val(r.date).replace('T',' ')}\nどこで：${val(r.place)}\n誰が（相手情報）：${val(r.person)}\n種別：${val(r.type)}\n何を（入力内容）：${val(r.content)}\n何回：${r.count?val(r.count)+'回':'不明'}\n証拠メモ：${val(r.evidence)}\n目撃者：${val(r.witness)}\n本人が選択した危険度：レベル${r.level} ${riskNames[r.level]}`),'\n相談したいこと・希望する支援：未記入（相談時に追記してください）','未記入情報は推測で補っていません。書き出したファイルの保存先と共有先を確認してください。'].join('\n');}
 const api={statuses,riskNames,allowed,transition,risk,report};root.Tonari=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

