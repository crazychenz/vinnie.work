var remark_config={
    site_id:"vinnie.work",
    host:"https://comments.vinnie.work/comments",
    url:window.location.href,
};
!function(e,t){for(var d=t.head||t.body,o=0;o<e.length;o++){var n=t.createElement("script"),m="noModule"in n,a=m?".mjs":".js";m&&(n.type="module"),n.async=!0,n.defer=!0,n.src=remark_config.host+"/web/"+e[o]+a,d.appendChild(n)}}(remark_config.components||["embed"],document)