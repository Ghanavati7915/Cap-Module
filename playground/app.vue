<template>
  <div style="padding:20px">
      <div> Cap Module From Nuxt module ,  <span style="font-weight: bold;font-size: large">playground!</span> </div>
      <p> LogIn / LogOut </p>
      <button v-if="!user" @click="login">LOGIN</button>
      <button v-if="user" @click="log_out">LOGOUT</button>
      <button @click="insertFakeData('fake','fname','alireza')">insertFakeData 1</button>
      <button @click="insertFakeData('fake','fname','saman')">insertFakeData 2</button>
      <button @click="insertFakeData('fake','lname','karami')">insertFakeData 3</button>
      <button @click="insertFakeData('users','hello','salam Azizam')">insertFakeData 4</button>
    <button @click="insertFakeData('config','token','aidwjwoajhogheruighergerg')">insertFakeData 5</button>
    <div v-if="user">
      <p>  User Info </p>
      <p>{{user}}</p>
    </div>
  </div>
</template>


<script setup lang="ts">
const { login,logout,checkLogin } = useCapAuth()
const route = useRoute()
const res = ref<any>(null);
const user = ref<any>(null);
onMounted(async () => {
  if (Object.keys(route.query).length > 0) {
    if (route.query.state) {
      res.value = await checkLogin(route.query.state , route.query.code);
      getUserData();
    }
  }else{
    getUserData();
  }
})

const insertFakeData = async (table:string,key:string,value:string) => {
  await IndexDBInsert(table, key , value)
}

const getUserData = async () => {
  user.value = await IndexDBGet('config', 'UserInfo')
  console.log('user.value : ' ,user.value)
}

const log_out = async () => {
  await logout();
  await getUserData();
}

</script>
