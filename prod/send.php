
<?php if(isset($_POST["submit_tel"]))
  {
  $email = 'glonassn1@yandex.ru';
  /* Отправляем email */
  mail($email, "Заказ обратного звонка на сайте...", "\n
  Посетитель заказал обратный звонок! \n
  Телефон : ".$_POST['tel']."
  ");
  header('Refresh: 2; url=https://glonassn1.ru/2/');
  echo "Спасибо за заявку. Наши специалисты скоро с вами свяжутся.";
  }
  ?>

