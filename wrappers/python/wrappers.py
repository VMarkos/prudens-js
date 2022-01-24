import execjs
import json

def abduce(kb_string, target, context=''): # kb as string, targets as list of strings;
    js_files = ['abduction.js', 'prudens.js', 'parsers.js', 'prudensUtils.js', 'wrappers.js']
    js_source = ''
    for js_file in js_files:
        with open(js_file, 'r') as file:
            js_source += file.read() + '\n'
    ctx = execjs.compile(js_source)
    proofs = ctx.call('abductionWrapper', kb_string, context, target + ';')
    return proofs

def deduce(kb_string, context_string):
    js_files = ['prudens.js', 'parsers.js', 'prudensUtils.js', 'wrappers.js']
    js_source = ''
    for js_file in js_files:
        with open(js_file, 'r') as file:
            js_source += file.read() + '\n'
    ctx = execjs.compile(js_source)
    output = ctx.call('deductionWrapper', kb_string, context_string) # TODO You haven't defined the js wrapper!!
    print(output)
    return output

# if __name__ == '__main__':
#     KNOWLEDGE_BASE = '''@KnowledgeBase
#         R4 :: w implies d;
#         R3 :: x, -y implies -d;
#         R2 :: b, d implies c;
#         R1 :: a implies b;'''
#     TARGET = 'c'
#     CONTEXT = 'a; w;'
#     deduce(KNOWLEDGE_BASE, CONTEXT)
