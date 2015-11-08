﻿/*!
 Light Grid 0.3.0 

 by Michał Dudak
 https://github.com/michaldudak/light-grid.git
 license: MIT

 build date: 2015-11-08T15:30:29.444Z
*/
!function(a,b,c,d){function e(a){var c=a[0],d=a[a.length-1],e=[c];do{if(c=c.nextSibling,!c)break;e.push(c)}while(c!==d);return b.element(e)}function f(a,c,e,f,g){function h(){j=l,i.filter&&(j=c(j,i.filter.expression,i.filter.comparator)),i.orderBy&&(j=e(j,i.orderBy.expression,i.orderBy.reverse)),k=j.length,i.limitTo&&0!==i.limitTo.limit&&(i.limitTo.begin&&(i.limitTo.begin>=k&&(i.limitTo.begin=0),j=j.slice(i.limitTo.begin,j.length)),j=f(j,i.limitTo.limit))}var i,j,k,l=a;this.setModel=function(a){l=a,h()},this.getGridModel=function(){return j},this.getModelItemCount=function(){return k},this.getCurrentViewSettings=function(){return i},this.saveModel=function(){},this.orderBy=function(a,b){i.orderBy={expression:a,reverse:b},h()},this.limitTo=function(a,b){a===d||null===a?i.limitTo=null:i.limitTo={limit:a,begin:b||0},h()},this.page=function(a){i.limitTo&&i.limitTo.limit&&(i.limitTo.begin=i.limitTo.limit*a),h()},this.filter=function(a,b){i.filter={expression:a,comparator:b},h()},this.reset=function(){i=b.copy(g),h()},this.reset()}function g(a){var c=[];if(a.limitTo&&(a.limitTo.limit&&c.push("limit="+a.limitTo.limit),a.limitTo.begin&&c.push("begin="+a.limitTo.begin)),a.orderBy&&a.orderBy.expression&&(c.push("orderBy="+encodeURIComponent(a.orderBy.expression)),a.orderBy.reverse&&c.push("reverse=true")),a.filter&&a.filter.expression){var d=a.filter.expression;if(b.isString(d))c.push("search="+encodeURIComponent(d));else if(b.isObject(d)){var e=[];for(var f in d)if(d.hasOwnProperty(f)){var g=d[f];e.push(encodeURIComponent(f)+":"+encodeURIComponent(g))}c.push("search="+e.join(","))}}return c.join("&")}function h(a){return a}function i(a,c,e,f,i){function j(d){function f(){c.get(i).success(function(a){var b=p.responseParser(a);l=b.data,m=b.totalResults,k=d})}if(a){d?(o=b.extend({},o,d),d=b.extend({},k,o)):d=k;var i=a;b.isFunction(p.settingsSerializer)||(p.settingsSerializer=g),b.isFunction(p.responseParser)||(p.responseParser=h);var j=p.settingsSerializer(d);j.length>0&&(i+=-1===i.indexOf("?")?"?":"&",i+=j),null!==n&&(e.cancel(n),n=null),p.debounceTime?n=e(function(){n=null,o=null,f()},p.debounceTime):f()}}var k=b.copy(f),l=[],m=0,n=null,o=null;this.debounceTime=i,this.settingsSerializer=g;var p=this;this.getGridModel=function(){return l},this.getModelItemCount=function(){return m},this.getCurrentViewSettings=function(){return k},this.saveModel=function(b){return c.post(a,b)},this.orderBy=function(a,b){var c={orderBy:{expression:a,reverse:b||!1}};j(c)},this.limitTo=function(a,b){var c={};a===d||null===a?c.limitTo=null:c.limitTo={limit:a,begin:b||0},j(c)},this.filter=function(a){var c=b.copy(k.limitTo);c&&(c.begin=0);var d={filter:{expression:a},limitTo:c};j(d)},this.setViewSettings=function(a){j(a)},this.refresh=function(){j()},this.reset=function(){k=b.copy(f),j()}}if("undefined"==typeof c)throw new Error("Light Grid requires jQuery.");if(b.element!==c)throw new Error("jQuery must be included before Angular.");b.module("lightGrid",[]).constant("DEFAULT_VIEW","read"),b.module("lightGrid").directive("lgGrid",function(){"use strict";return{scope:!0,controller:["$scope","$attrs",function(a,b){this.getModel=function(){return a.grid.data},this.getInitialView=function(){return b.initialView},this.switchView=function(b){a.$parent.$broadcast("switchView:"+this.getIdentifier(),b)},this.getIdentifier=function(){return a.$$gridId}}],require:"lgGrid",link:{pre:function(a,b,c,d){a.$$gridId=Math.floor(1e6*Math.random()),a.grid={data:a.$eval(c.model),controller:d},a.$watch(c.model,function(b,c){b!==c&&(a.grid.data=b)}),b.addClass("light-grid")}}}}),b.module("lightGrid").directive("lgRow",["$parse","$animate","DEFAULT_VIEW",function(a,c,f){"use strict";function g(){return Object.create(null)}function h(a){var c={};this.switchView=function(b){a.row.view=b},this.acceptViewModel=function(){b.extend(a.row.data,a.row.viewModel)},this.registerView=function(a){c[a]=!0},this.isViewRegistered=function(a){return!!c[a]}}var i="$$NG_REMOVED",j=function(a,c,d,e,g,h,i){a[d]=e,a.$index=c,a.$first=0===c,a.$last=c===g-1,a.$middle=!(a.$first||a.$last),a.$odd=!(a.$even=0===(1&c)),a.row={data:a.$$rowData,view:i.getInitialView()||f,viewModel:b.copy(a.$$rowData),controller:h},a.$on("switchView:"+i.getIdentifier(),function(a,b){h.switchView(b)})},k=function(a){return a.clone[0]},l=function(a){return a.clone[a.clone.length-1]};return{restrict:"A",multiElement:!0,transclude:"element",priority:1e3,terminal:!0,$$tlb:!0,require:"^lgGrid",compile:function(){var a=document.createComment(" end lgRow "),f="$$rowData",m="grid.data",n=function(a){return a};return function(o,p,q,r,s){var t=g();o.$watchCollection(m,function(m){function o(a){a&&a.scope&&(t[a.id]=a)}var q,u,v,w,x,y,z,A,B,C,D,E,F=p[0],G=g();A=n,B=[];for(var H in m)m.hasOwnProperty(H)&&"$"!==H.charAt(0)&&B.push(H);for(w=B.length,D=new Array(w),q=0;w>q;q++)if(x=m===B?q:B[q],y=m[x],z=A(x,y,q),t[z])C=t[z],delete t[z],G[z]=C,D[q]=C;else{if(G[z])throw b.forEach(D,o),new Error("Duplicate rows detected. The grid cannot render the same row twice. Use angular.copy to create a new instance. Duplicate value: "+y);D[q]={id:z,scope:d,clone:d},G[z]=!0}for(var I in t){if(C=t[I],E=e(C.clone),c.leave(E),E[0].parentNode)for(u=E.length,q=0;u>q;q++)E[q][i]=!0;C.scope.$destroy()}for(q=0;w>q;q++)if(x=m===B?q:B[q],y=m[x],C=D[q],C.scope){v=F;do v=v.nextSibling;while(v&&v[i]);k(C)!==v&&c.move(e(C.clone),null,b.element(F)),F=l(C),j(C.scope,q,f,y,w,new h(C.scope),r)}else s(function(d,e){C.scope=e;var g=a.cloneNode(!1);d[d.length++]=g,c.enter(d,null,b.element(F)),F=g,C.clone=d,G[C.id]=C,j(C.scope,q,f,y,w,new h(C.scope),r)});t=G})}}}}]),b.module("lightGrid").directive("lgView",["$compile",function(a){"use strict";function c(a){return a.length>1?b.isDefined(a.first().attr("lg-view-initialized")):b.isDefined(a.attr("lg-view-initialized"))}return{multiElement:!0,link:function(b,d,e){if(!c(d)){var f,g=e.lgView||e.view;f=g?g.split(",").map(function(a){return a.trim()}):[],f.forEach(function(a){b.row.controller.registerView(a)}),b.shouldShowDefaultView=function(a){return!b.row.controller.isViewRegistered(a)};var h;if(h=0===f.length?"shouldShowDefaultView(row.view)":f.map(function(a){return"row.view === '"+a+"'"}).join(" || "),d.length>1){var i=d.first(),j=d.last();i.attr("ng-if-start","displayCondition"),i.attr("lg-view-initialized",""),j.attr("ng-if-end","")}else d.attr("lg-view-initialized",""),d.attr("ng-if",h);a(d)(b)}}}}]),b.module("lightGridDataProviders",["lightGrid"]),b.module("lightGridDataProviders").provider("lgLocalDataProviderFactory",function(){var a=this;this.defaultViewSettings={orderBy:null,limitTo:null,filter:null},this.$get=["filterFilter","orderByFilter","limitToFilter",function(b,c,d){return{create:function(e){return new f(e,b,c,d,a.defaultViewSettings)}}}]}),b.module("lightGridDataProviders").provider("lgServerDataProviderFactory",function(){var a=this;this.defaultViewSettings={orderBy:null,limitTo:null,filter:null},this.debounceTime=150,this.$get=["$http","$timeout",function(b,c){return{create:function(d){return new i(d,b,c,a.defaultViewSettings,a.debounceTime)}}}]}),b.module("lightGridControls",["lightGrid"]),b.module("lightGridControls").directive("lgExpandedRow",["$animate",function(a){"use strict";return{multiElement:!0,transclude:"element",priority:600,terminal:!0,restrict:"A",require:"^?lgRow",$$tlb:!0,link:function(b,c,d,f,g){var h,i,j;b.$watch("row.expanded",function(b){b?i||g(function(b,d){i=d,b[b.length++]=document.createComment(" end lgExpandedRow "),h={clone:b},a.enter(b,c.parent(),c)}):(j&&(j.remove(),j=null),i&&(i.$destroy(),i=null),h&&(j=e(h.clone),a.leave(j).then(function(){j=null}),h=null))})}}}]),b.module("lightGridControls").directive("lgPager",function(){"use strict";return{scope:{provider:"=",pageSizeOptions:"@"},template:"<div class='pager'><button ng-disabled='isFirst' class='first' ng-click='goToFirst()'>Last</button><button ng-disabled='isFirst' class='previous' ng-click='goToPrevious()'>Previous</button><span class='pager-summary'>Page {{currentPage + 1}} of {{pageCount}}</span><button ng-disabled='isLast' class='next' ng-click='goToNext()'>Next</button><button ng-disabled='isLast' class='last' ng-click='goToLast()'>Last</button></div><div class='page-size'><select class='form-control' ng-options='size for size in pageSizes' ng-model='pageSize'></select></div>",link:function(a){function b(){a.pageSizes=a.pageSizeOptions.split(",").map(function(a){return parseInt(a,10)}).filter(function(a){return!isNaN(a)})}function c(a,b){return Math.floor(a/b)}function d(a,b){return Math.ceil(b/a)}function e(b){var e=a.provider.getModelItemCount();b?(a.currentPage=c(b.begin,b.limit),a.pageCount=d(b.limit,e),a.pageSize=b.limit,-1===a.pageSizes.indexOf(a.pageSize)&&(a.pageSizes.push(a.pageSize),a.pageSizes.sort(function(a,b){return a-b}))):(a.currentPage=0,a.pageCount=1),a.isFirst=a.currentPage<=0,a.isLast=a.currentPage>=a.pageCount-1}function f(b){0>b?b=0:b>=a.pageCount&&(b=a.pageCount-1);var c=a.pageSize*b;a.provider.limitTo(a.pageSize,c)}var g="10,25,50";a.pageSizeOptions=a.pageSizeOptions||g,b(),0===a.pageSizes.length&&(a.pageSizeOptions=g,b()),a.pageSize=a.pageSizes[0],f(0),a.$watch("provider.getCurrentViewSettings().limitTo",function(a){e(a)},!0),a.$watch("provider.getModelItemCount()",function(){e(a.provider.getCurrentViewSettings().limitTo)}),a.$watch("pageSize",function(b){a.provider.limitTo(b,0)}),a.goToFirst=function(){f(0)},a.goToPrevious=function(){f(a.currentPage-1)},a.goToNext=function(){f(a.currentPage+1)},a.goToLast=function(){f(a.pageCount-1)}}}}),b.module("lightGridControls").directive("lgPersistData",["$q",function(a){"use strict";return{restrict:"A",link:function(b,c,d){c.on("click",function(){var c=b.$eval(d.provider),e=b.row.controller;a.when(c.saveModel(b.viewData)).then(function(){e&&(e.acceptViewModel(),e.switchView("read"))})})}}}]),b.module("lightGridControls").directive("lgSorter",["$timeout",function(a){"use strict";return{template:"<span class='sorter {{ cssClass }}'><span ng-transclude class='columnTitle'></span></span>",transclude:!0,replace:!0,scope:!0,link:function(b,c,d){function e(){b.isSorted?b.cssClass=b.sortDirectionDescending?"sorter-desc":"sorter-asc":b.cssClass=""}var f=d.sortProperty||d.lgSorter,g=b.$eval(d.provider);b.dataProvider=g,b.isSorted=!1,b.sortDirectionDescending=!0,c.on("click",function(){a(function(){g.orderBy(f,!b.sortDirectionDescending)})}),b.$watch("dataProvider.getCurrentViewSettings().orderBy",function(a){a?(b.isSorted=f===a.expression,b.sortDirectionDescending=b.isSorted?a.reverse:!0):(b.isSorted=!1,b.sortDirectionDescending=!0),e()})}}}]),b.module("lightGridControls").directive("lgSwitchView",["$timeout",function(a){"use strict";return{restrict:"A",link:function(b,c,d){var e=d.lgSwitchView;c.on("click",function(){a(function(){b.row.controller.switchView(e)})})}}}]),b.module("lightGridControls").directive("lgToggleExpandedRow",["$timeout",function(a){"use strict";return{require:"^?lgRow",restrict:"A",link:function(b,c){c.on("click",function(){a(function(){b.row.expanded=!b.row.expanded})})}}}])}(window,window.angular,window.jQuery);
//# sourceMappingURL=light-grid.min.js.map