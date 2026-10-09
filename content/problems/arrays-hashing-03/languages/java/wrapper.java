import java.io.*; import java.util.*;
{{USER_CODE}}
public class Main { public static void main(String[] args) throws Exception { Scanner scan=new Scanner(new BufferedInputStream(System.in)); int count=scan.nextInt(); for(int c=0;c<count;c++){int n=scan.nextInt();int[] values=new int[n];for(int i=0;i<n;i++)values[i]=scan.nextInt();System.out.println(new Solution().solve(values));} } }
