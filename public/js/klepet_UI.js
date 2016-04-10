function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jeSlika = vsebujeSliko(sporocilo);
  if (jeSlika){
    while (sporocilo.search('&lt') > -1){
      sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('\'slika\' /&gt;', '\'slika\' />');
    }
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
  var jeVideo = vsebujeVideo(sporocilo);
  if (jeVideo) {
    while (sporocilo.search('&lt') > -1) {
      sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;iframe', '<iframe').replace('allowfullscreen&gt;', 'allowfullscreen>').replace('&lt;/iframe&gt;', '</iframe>');
    }
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
  if (jeSmesko) {
    
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}
function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  sporocilo = dodajSlike(sporocilo);
  sporocilo = dodajVideo(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

// funkcija za prepoznavanje slik
function dodajSlike(besedilo) {
  if (vsebujeSliko(besedilo)){
    var slika = besedilo.match(new RegExp('\\b' + '(http|https)://.*.(gif|jpg|png)', 'gi'));
    var tmp = slika[0];
    var tabela = tmp.split(" ");
    var izpis = new Array(tabela.length);
    for (var i = 0; i < tabela.length; i++) {
      izpis[i] = "<img src='"+ tabela[i] + "' id='slika' />";
    }
    var vrni = "";
    if(jeZasebno(besedilo)){
        for(var j = 0; j < 2; j++){
          besedilo = besedilo.replace('"', '');
        }
      }
    for (var i = 0; i < tabela.length; i++) {
      //console.log(izpis[i]);
      if(izpis[i].search(new RegExp('\\b' + '(http|https)://.*.(gif|jpg|png)', 'gi')) > -1){
      vrni = vrni + izpis[i];
      }
    }
    if (jeZasebno(besedilo)){
      var zasebno = besedilo.split(" ");
      besedilo = besedilo.replace('/zasebno', '').replace(zasebno[1], '');
      return '/zasebno "' + zasebno[1] + '" "' + besedilo + vrni+ '"';
    } else {
    return besedilo + vrni;
    }
  }
  else {
    return besedilo;
  }
}

//funkcija za dodajanje slik
function vsebujeSliko(besedilo) {
  var izraz = new RegExp('\\b' + '(http|https)://.*.(gif|jpg|png)', 'gi');
  if (besedilo.search(izraz) > -1) {
    return true;
  }
  else {
    return false;
  }
}

function jeZasebno(besedilo) {
  if (besedilo.search(new RegExp('/zasebno', 'gi')) > -1){
    return true;
  } else {
    return false;
  }
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });
  

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
  
    $('#seznam-uporabnikov div').click(function() {
      var uporabnik = $(this).text()
      $('#poslji-sporocilo').val('/zasebno "' + uporabnik + '" ');
      $('#poslji-sporocilo').focus();
  });
});

  
  socket.on('dregljaj', function() {
      $('#vsebina').jrumble();
      //začni z tresenjem
      $('#vsebina').trigger('startRumble');
      //zakasni in ustavi tresenje
      setTimeout(function () {$('#vsebina').trigger('stopRumble')}, 1500);
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  };
  
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}

function dodajVideo(besedilo) {
  if (vsebujeVideo(besedilo)){
    if (jeZasebno(besedilo)) {
      for (var i = 0; i < 4; i++){
        besedilo = besedilo.replace('"', '');
      }
    }
    var video = besedilo.match(new RegExp('\\b' + 'https://www.youtube.com/watch?.*', 'gi'));
    video = video[0];
    while(video.search(new RegExp('\\b' + 'https://', 'gi')) > -1) {
      video = video.replace("https://www.youtube.com/watch?v=", "->>");
    }
    var tmp = video;
    var tabela = tmp.split(" ");
    var izpis = new Array(tabela.length);
    for (var i = 0; i < tabela.length; i++){
      if (tabela[i].search('->>') == 0){
        tabela[i] = tabela[i].replace('->>','').replace('<img','');
        izpis[i] = "<iframe id='video' src='https://www.youtube.com/embed/" + tabela[i] + "' allowfullscreen></iframe>";
      } else {
        izpis[i] = ""; 
      }
    }
    var vrni = "";
    for (var i = 0; i < tabela.length; i++) {
      vrni = vrni + izpis[i];
    }
    if (jeZasebno(besedilo)){
      var zasebno = besedilo.split(" ");
      console.log(zasebno[1]);
      besedilo = besedilo.replace('/zasebno', '').replace(zasebno[1], '');
      return '/zasebno "' + zasebno[1] + '" "' + besedilo + vrni + '"';
    } else {
      return besedilo + vrni;
    }
  }
  else {
    return besedilo;
  }
}

function vsebujeVideo(besedilo) {
  var izraz = new RegExp('\\b' + 'https://www.youtube.com/watch?', 'gi');
  if (besedilo.search(izraz) > -1) {
    return true;
  }
  else {
    return false;
  }
}