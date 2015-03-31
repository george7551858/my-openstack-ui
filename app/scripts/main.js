/* jshint devel:true */
'use strict';

var openstack_url = 'http://10.71.99.1';
var services_mapping = {
  nova: ':8774/v2/',
  neutron: ':9696/v2.0/',
  keystone: ':5000/v2.0/',
  heat: ':8004/'
};

function get_token() {

  if (Cookies.get("token")) {
    $('#json_ret').text(
      Cookies.get("token")+'\n'+Cookies.get("tenant")
    );
    show_table();
    return;
  }

  var url = openstack_url+services_mapping.keystone+'tokens';
  var tenantName = $('#tenantName').val();
  var username = $('#username').val();
  var password = $('#password').val();
  var content = {"auth": {
    "tenantName": tenantName,
    "passwordCredentials": {"username": username, "password":password }
  }};


  var jqxhr = openstack_api(url, 'post', JSON.stringify(content));

  jqxhr.done(function(ret) {
    $('#json_ret').text(JSON.stringify(ret.access, null, '\t'));
    show_table(ret.access.serviceCatalog);
    Cookies.set("token",  ret.access.token.id,        {expires:60*60});
    Cookies.set("tenant", ret.access.token.tenant.id, {expires:60*60});
  });
}



function add_server() {
  var url = gen_REST_url("nova","servers",null);
  openstack_api(url,'post','{"server":{"name":"CCC","imageRef":"5cb64e7b-fa84-4f85-a6d2-555bd43b3c7b","availability_zone":"nova","flavorRef":"42","OS-DCF:diskConfig":"AUTO","max_count":1,"min_count":1,"networks":[{"uuid":"ca286a23-6f31-4280-b6de-e9d400ab1369"}],"security_groups":[{"name":"default"}]}}');
}


function gen_REST_url (component, resource, item_id) {
  var tenant_id = Cookies.get("tenant");
  var res = openstack_url;
  res+= services_mapping[component];
  if(component == "nova" && resource !== undefined ) {res+= tenant_id;}
  if(resource) {res+= '/'+resource;}
  if(resource && item_id) {res+= '/'+item_id;}

  return res;
}

function openstack_api(REST_url, method, content) {
  show_table();
  $('#resource_url').val(REST_url);
  $('#request_content').val(content);

  var token_id = Cookies.get("token");

  var $jqXHR = $.ajax({
    url: 'http://localhost/op/api.php',
    dataType: 'jsonp',
    data: {
      url: REST_url,
      token: token_id,
      method: method,
      content: content
    }
  })
  .done(function(ret) {
    $('#json_ret').text(JSON.stringify(ret, null, '\t'));
  });
  return $jqXHR;
}

function show_table(ary) {
  $('#list_ret').empty();

  if( ! $.isArray(ary) ) {return;}

  var $thead = $("<tr>");
  var $th = $("<th>").text("#");
  $thead.append($th);
  $.each(ary[0], function(index) {
    $th = $("<th>").text(index);
    $thead.append($th);
  });
  $('#list_ret').append($thead);

  $.each(ary, function(index, val) {
    var $tr = $("<tr>").data("index",index);
    var $td = $("<td>");
    // $td.append('<button class="get">More</button>');
    // $td.append('<button class="delete">Del</button>');
    $tr.append($td);
    $.each(val, function(index, val) {
      if (typeof val === "object"){
        $td = $("<td>").append('<pre>'+JSON.stringify(val, null, '\t')+'</pre>');
      }
      else{
        $td = $("<td>").text(val);
      }
      $tr.append($td);
    });

    $('#list_ret').append($tr);
  });
}

$('body').on('click', '.btn[id]', function(event) {
  event.preventDefault();
  var fn = window[this.id];
  if (typeof fn === "function") {fn.apply(null);}
});

$('#component.btn-group').on('change', 'input', function(event) {
  event.preventDefault();

  $('.resource').hide();
  $('.'+this.id).show();

  var url = gen_REST_url(this.id);
  openstack_api(url);
});

$('.resource').on('click', 'a', function(event) {
  event.preventDefault();
  var component = $(this).parents(".resource").data('component');
  var resource = this.href.replace(/^.*#/, "");
  var url = gen_REST_url(component,resource);
  var jqxhr = openstack_api(url);
  jqxhr.done(function(ret) {
    show_table(ret[resource]);
  });
});

// $('#list_ret').on('click', 'button', function(event) {
//   event.preventDefault();
//   function pop(obj) {
//     for (var key in obj) return key;
//   }

//   var resource = pop(tmp_data);
//   var index = $(this).parents("tr").data('index');

//   var url = gen_REST_url("nova",resource, tmp_data[resource][index].id);
//   openstack_api(url, this.className);
// });



$('#custom_request').on('click', 'a', function(event) {
  event.preventDefault();
  var resource_url = $("#resource_url").val();
  var method = this.href.replace(/^.*#/, "");
  var content = $("#request_content").val();

  openstack_api(resource_url,method,content);
});

function custom_request_get () {
  $('#custom_request a').eq(0).trigger('click');
}
