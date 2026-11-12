(function(){
  var menu=document.querySelector('.menu'),links=document.querySelector('.navlinks');
  if(menu&&links){menu.addEventListener('click',function(){var o=links.classList.toggle('open');menu.setAttribute('aria-expanded',o)});
    links.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){links.classList.remove('open');menu.setAttribute('aria-expanded','false')})});}
  document.querySelectorAll('[data-year]').forEach(function(e){e.textContent=new Date().getFullYear()});
  var els=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}})},{threshold:.12});els.forEach(function(e){io.observe(e)})}
  else els.forEach(function(e){e.classList.add('show')});
  var steps=document.querySelectorAll('[data-pipeline] .agent-step');
  if(steps.length&&!matchMedia('(prefers-reduced-motion: reduce)').matches){var i=0;
    setInterval(function(){i=(i+1)%(steps.length+1);steps.forEach(function(s,n){s.classList.toggle('done',n<i);s.classList.toggle('active',n===i);var em=s.querySelector('em');if(em)em.textContent=n<i?'COMPLETE':n===i?'RUNNING':'QUEUED'})},1800)}
})();
