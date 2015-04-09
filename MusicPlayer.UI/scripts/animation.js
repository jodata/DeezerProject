$(document).ready(function(){
    $("a").on("click",function(){
        alert("click");
        $(".navbar-nav>li.active").removeClass("active");
        $(this).addClass("active");
    });
});