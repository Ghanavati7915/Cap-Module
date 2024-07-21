<template>
  <div style="padding:20px">
      <div> Cap Module From Nuxt module ,  <span style="font-weight: bold;font-size: large">playground!</span> </div>
      <p> LogIn / LogOut </p>
      <button v-if="!user" @click="login">LOGIN</button>
      <button v-if="user" @click="log_out">LOGOUT</button>
      <button v-if="user" @click="refreshToken">Refresh Token</button>
      <button @click="testAPICaller">Get Data</button>
      <button @click="insertFakeData('fake','fname','alireza')">insertFakeData 1</button>
      <button @click="insertFakeData('fake','fname','saman')">insertFakeData 2</button>
      <button @click="insertFakeData('fake','lname','karami')">insertFakeData 3</button>
      <button @click="insertFakeData('users','hello','salam')">insertFakeData 4</button>
    <button @click="insertFakeData('config','token','aidwjwoajhogheruighergerg')">insertFakeData 5</button>
    <div v-if="user">
      <p>  User Info </p>
      <p>{{user}}</p>
    </div>
  </div>
</template>


<script setup lang="ts">
const { login,logout,checkLogin,refreshToken,getLoggedInUser } = useCapAuth()
const route = useRoute()
const res = ref<any>(null);
const user = ref<any>(null);
onMounted(async () => {

  if (route.query && route.query.code) {
    let code = route.query.code;
    let state:any = null;
    if (route.query.internalPage) {
      let internalPage = route.query.internalPage.toString().split('?state=')[0];
      state = route.query.internalPage.toString().split('?state=')[1];
    }
    else {
      state = route.query.state;
    }
    res.value = await checkLogin(state , code);
    getUserData();
  }
  else {
    getUserData();
  }
})

const insertFakeData = async (table:string,key:string,value:string) => {
  await IndexDBInsert(table, key , value)
}

const testAPICaller = async () => {
  try {
    const capAPI = useCapApi()
    const { data } = await (await capAPI.useAPI())({
      method: 'get',
      url: 'City/GetAll',
      params: {
        Page : 1,
        PageSize : 10,
      },
      data: {}
    })
    return {result: true, msg: 'Success', data}
  } catch (e) {
    return {result: false, msg: 'ERROR'}
  }
}


const getUserData = async () => {
  user.value = await getLoggedInUser();
}

const log_out = async () => {
  await logout();
  await getUserData();
}

</script>
